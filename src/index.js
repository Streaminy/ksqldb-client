/**
 * Http2: https://github.com/nodejs/http2
 * Api docs: https://github.com/nodejs/http2/blob/master/doc/api/http2.md
 */
const http2 = require("http2");
const {
    QueryHandler,
    StatementHandler,
    AdminStatementHandler,
    StreamQueryHandler,
    CloseQueryHandler,
    InsertStreamHandler,
} = require("./Handlers");

/**
 * 5) Usernames of the client may wish to receive result rows in different ways:
 *  - Do not block. Rather, perform an action asynchronously on each new row as it arrives (Pull Query DONE)
 *  - Block until the next row arrives
 *  - Block until all rows have arrived. This only makes sense in the context of pull queries and push queries with LIMIT clauses. (Pull Query DONE)
 * 6) (ASK) The client must expose #options for specifying the address of the ksqlDB server to connect to.
 *  - Support for TLS-enabled ksqlDB servers
 *  - Support for mutual-TLS-enabled ksqlDB servers
 */

/**
 * Simple KsqlDB Node.JS client made with love by Streaminy.io
 */
module.exports = class KsqldbClient {
    #http2Session;
    #options;
    #asyncConnection;

    connected;

    /**
     * Default values
     */
    #DEFAULT_HOST = "http://localhost";
    #DEFAULT_HOST_PORT = 8088;
    #DEFAULT_ALPN = [];
    #DEFAULT_TIMEOUT = 25000;

    /**
     * Endpoints
     */
    static QUERY_STREAM_ENDPOINT = "/query-stream";
    static INSERTS_ENDPOINT = "/inserts-stream";
    static CLOSE_QUERY_ENDPOINT = "/close-query";
    static KSQL_ENDPOINT = "/ksql";

    /**
     * Execute statement regex
     */
    #QUOTED_STRING_OR_IDENTIFIER = "(`([^`]*|(``))*`)|('([^']*|(''))*')";

    constructor(options) {
        this.#options = options || {};
        this.connected = false;
    }

    /**
     * Checks if the host URL starts with http:// or https://.
     * If nots it will append http:// by default.
     * @param {*} host
     * @returns
     */
    #buildHostUrl(host) {
        if (host) {
            const parsedHost = !/^https?:\/\//i.test(host) ? `http://${host}` : host;
            return parsedHost;
        } else {
            return this.#DEFAULT_HOST;
        }
    }

    /**
     * Connects the client to the KsqlDB instance.
     * @returns a promise that completes once the client connects.
     */
    connect() {
        this.#asyncConnection = new Promise((resolve, reject) => {
            try {
                const { authorization, host, port, alpnProtocols, timeout, sessionOptions } = this.#options;
                const additionalOptions = sessionOptions || {};
                const hostUrl = this.#buildHostUrl(host);

                this.#http2Session = http2.connect(`${hostUrl}:${port || this.#DEFAULT_HOST_PORT}`, {
                    ...additionalOptions,
                    timeout: timeout || this.#DEFAULT_TIMEOUT,
                    ca: authorization && typeof authorization.ssl === "object" && authorization.ssl.ca,
                    cert: authorization && typeof authorization.ssl === "object" && authorization.ssl.cert,
                    key: authorization && typeof authorization.ssl === "object" && authorization.ssl.key,
                    ALPNProtocols: alpnProtocols || this.#DEFAULT_ALPN,
                });

                this.#http2Session.setTimeout(timeout || this.#DEFAULT_TIMEOUT, () => {
                    if (this.connected === false) {
                        const timeoutError = new Error("Connection timeout.");
                        reject(timeoutError);
                        this.#http2Session.destroy(timeoutError);
                    }
                });

                this.#http2Session.on("connect", () => {
                    this.connected = true;
                    resolve();
                });

                this.#http2Session.on("error", (http2ClientErr) => {
                    console.error("Error on Http2 client.", http2ClientErr);
                    reject(http2ClientErr);
                });
            } catch (errBuildingConnection) {
                reject(errBuildingConnection);
            }
        });

        return this.#asyncConnection;
    }

    /**
     * Disconnects client from KsqlDB instance.
     */
    disconnect() {
        return new Promise((resolve, reject) => {
            this.connected = false;
            if (this.#http2Session) {
                if (this.#http2Session.destroyed) {
                    resolve();
                    return;
                }
                this.#http2Session.destroy();
                resolve();
            } else {
                reject(new Error("No client connected."));
            }
        });
    }

    /**
     * Builds basic authorization to interact with KsqlDB.
     * @returns the encoded authorization using constructor data.
     */
    #buildBasicAuth() {
        const { authorization } = this.#options;
        const { username, password } = authorization;

        try {
            const encoded = Buffer.from(`${username}:${password} `).toString("base64");
            /**
             * Username and password encoded in base64
             */
            return `Basic ${encoded} `;
        } catch (e) {
            console.error("Error building basic authorization.");
            throw e;
        }
    }

    /**
     * Creates and send a HTTP/2 request to KsqlDB.
     *
     * @param {*} path
     * @param {*} body
     * @param {*} requestHandler
     * @returns a promise that completes once the server response is received
     */
    #request(path, buffer, requestHandler, accept) {
        const reqConfig = {
            ":scheme": "http",
            ":method": "POST",
            ":path": path,
            Accept: accept || "application/json",
            "Content-Type": "application/json",
            "Content-Length": buffer.length,
        };

        if (this.authorization && this.authorization.username && this.authorization.password) {
            const authToken = this.#buildBasicAuth(this.authorization);
            reqConfig.Authorization = authToken;
        }

        /**
         * Write request
         */
        const request = this.#http2Session.request(reqConfig, {
            endStream: false,
        });
        request.setEncoding("utf8");
        const handleRequestPromise = requestHandler.handleRequest(request);
        request.write(buffer);
        request.end();

        return handleRequestPromise;
    }

    /**
     * This is replicates Java KslqDB Client Code in class DdlDmlRequestValidators
     * Counts the number of sql statements in a string by
     *  1. Removing all of the sql strings and identifiers
     *  2. Splitting the remaining substrings by ';'. The -1 argument in the split
     *     function call ensures that each ';' will always have two partitions surrounding it, so that
     *     the number of partitions is the same whether or not the final ';' has whitespace after it.
     *  3. Counting the partitions
     * @param sql a string containing sql statements
     * @return the number of sql statements in the string
     */
    countStatements(statement) {
        return statement
            .split(this.#QUOTED_STRING_OR_IDENTIFIER)
            .map((part) => part.split(";", -1).length - 1)
            .reduce((sum, partLength) => sum + partLength, 0);
    }

    /**
     * Validates statements
     * @param {*} statement
     */
    validateExecuteStatementRequest(statement) {
        if (statement.indexOf(";") === -1) {
            throw new Error("Missing semicolon in SQL for executeStatement() request.");
        }

        if (this.countStatements(statement) > 1) {
            throw new Error("executeStatement() may only be used to execute one statement at a time.");
        }
    }

    /**
     * This method may be used to issue pull queries.
     *
     * Sends a SQL request to the ksqlDB server. This method supports 'CREATE', 'CREATE ... AS
     * SELECT', 'DROP', 'TERMINATE', and 'INSERT INTO ... AS SELECT' statements.
     *
     * @param {string} statement of query to execute
     * @param {Object} optionalExtraParams like streamsProperties, sessionVariables or commandSequenceNumber
     * @param {string} path of KsqlDB endpoint
     * @return a promise that completes once the server response is received
     */
    async executeStatement(statement, optionalExtraParams, path) {
        if (this.#asyncConnection) {
            await this.#asyncConnection;

            if (!path || path === KsqldbClient.KSQL_ENDPOINT) {
                this.validateExecuteStatementRequest(statement);
            }

            let body = {};

            if (optionalExtraParams) {
                body = {
                    ...optionalExtraParams,
                };
            }

            if (statement) {
                body = {
                    ...body,
                    ksql: statement,
                };
            }

            const handlerMap = {};
            handlerMap[KsqldbClient.CLOSE_QUERY_ENDPOINT] = CloseQueryHandler;
            handlerMap[KsqldbClient.KSQL_ENDPOINT] = StatementHandler;
            handlerMap[KsqldbClient.INSERTS_ENDPOINT] = InsertStreamHandler;

            const requestHandler = handlerMap[path] ? new handlerMap[path]() : new StatementHandler();

            /**
             * Build request buffer
             */
            const buffer = Buffer.from(JSON.stringify(body));
            const requestPromise = this.#request(path || KsqldbClient.KSQL_ENDPOINT, buffer, requestHandler);

            /**
             * If the query has a bad query it will return successfuly. Then whoever pick the answer
             * needs to validate the response.
             */
            return requestPromise;
        } else {
            throw new Error("Client is not connected.");
        }
    }

    /**
     * This method may be used to issue pull queries.
     *
     * Sends a SQL request to the ksqlDB server. This method supports 'CREATE', 'CREATE ... AS
     * SELECT', 'DROP', 'TERMINATE', and 'INSERT INTO ... AS SELECT' statements.
     *
     * @param {string} statement of query to execute
     * @param {string} path of KsqlDB endpoint
     * @return a promise that completes once the server response is received
     */
    async #executeAdminStatement(statement, path) {
        if (this.#asyncConnection) {
            await this.#asyncConnection;
            let body = {
                ksql: statement,
            };

            const requestHandler = new AdminStatementHandler();

            /**
             * Build request buffer
             */
            const buffer = Buffer.from(JSON.stringify(body));
            const requestPromise = this.#request(path, buffer, requestHandler);

            /**
             * If the query has a bad query it will return successfuly. Then whoever pick the answer
             * needs to validate the response.
             */
            return requestPromise;
        } else {
            throw new Error("Client is not connected.");
        }
    }

    /**
     * This method may be used to issue pull queries.
     * @param {string} statement of query to execute
     * @param {Object} optionalExtraParams like streamsProperties, sessionVariables or commandSequenceNumber
     *
     * @return a promise that completes once the server response is received
     */
    async query(query, optionalExtraParams) {
        if (this.#asyncConnection) {
            await this.#asyncConnection;

            let body = {};

            if (optionalExtraParams) {
                body = {
                    ...optionalExtraParams,
                };
            }

            body = {
                ...body,
                sql: query,
            };

            const buffer = Buffer.from(JSON.stringify(body));
            const requestHandler = new QueryHandler();
            const requestPromise = this.#request(KsqldbClient.QUERY_STREAM_ENDPOINT, buffer, requestHandler);

            /**
             * If the query has a bad query it will return successfuly. Then whoever pick the answer
             * needs to validate the response.
             */
            return requestPromise;
        } else {
            throw new Error("Client is not connected.");
        }
    }

    /**
     * This method may be used to issue push queries.
     * @param {string} statement of query to execute
     * @param {Function} callback to push query data
     * @param {Object} optionalExtraParams like streamsProperties, sessionVariables or commandSequenceNumber
     */
    async streamQuery(streamQuery, callback, optionalExtraParams) {
        if (this.#asyncConnection) {
            await this.#asyncConnection;

            /**
             * Parser wrapper around callback to load metadata
             */

            let body = {};

            if (optionalExtraParams) {
                body = {
                    ...optionalExtraParams,
                };
            }

            body = {
                ...body,
                sql: streamQuery,
            };

            const buffer = Buffer.from(JSON.stringify(body));
            const requestHandler = new StreamQueryHandler(callback);
            const requestPromise = this.#request(
                KsqldbClient.QUERY_STREAM_ENDPOINT,
                buffer,
                requestHandler,
                "application/vnd.ksqlapi.delimited.v1"
            );

            /**
             * If the streamQuery has a bad query it will return successfuly. Then whoever pick the answer
             * needs to validate the response.
             */
            return requestPromise;
        } else {
            throw new Error("Client is not connected.");
        }
    }

    /**
     * Inserts a row into a ksqlDB stream.
     *
     * @param streamName name of the target stream
     * @param row the rows to insert. Keys are column names and values are column values.
     *
     * @return a promise that completes once the server response is received
     */
    async insertInto(streamName, row) {
        if (this.#asyncConnection) {
            await this.#asyncConnection;

            const body = {
                target: streamName,
            };
            const buffer = Buffer.from(JSON.stringify(body)) + "\n" + JSON.stringify(row);
            const requestHandler = new InsertStreamHandler();
            const requestPromise = this.#request(KsqldbClient.INSERTS_ENDPOINT, buffer, requestHandler);

            /**
             * If the query has a bad query it will return successfuly. Then whoever pick the answer
             * needs to validate the response.
             */
            return requestPromise;
        } else {
            throw new Error("Client is not connected.");
        }
    }

    /**
     * Terminates a push query with the specified query ID.
     *
     * @param {*} queryId
     */
    async terminatePushQuery(queryId) {
        const terminate = await this.executeStatement(undefined, { queryId }, KsqldbClient.CLOSE_QUERY_ENDPOINT);
        return terminate;
    }

    /**
     * Returns the list of ksqlDB streams from the ksqlDB server's metastore.
     *
     * @return list of streams
     */
    async listStreams() {
        const { data, error } = await this.#executeAdminStatement("LIST STREAMS;", KsqldbClient.KSQL_ENDPOINT);
        if (!data || error) {
            return [];
        } else {
            const { rows } = data;
            const [{ streams }] = rows;
            return streams;
        }
    }

    /**
     * Returns the list of ksqlDB tables from the ksqlDB server's metastore
     *
     * @return list of tables
     */
    async listTables() {
        const { data } = await this.#executeAdminStatement("LIST TABLES;", KsqldbClient.KSQL_ENDPOINT);
        const { rows } = data;
        const [{ tables }] = rows;
        return tables;
    }

    /**
     * Returns the list of Kafka topics available for use with ksqlDB.
     *
     * @return list of topics
     */
    async listTopics() {
        const { data } = await this.#executeAdminStatement("LIST TOPICS;", KsqldbClient.KSQL_ENDPOINT);
        const { rows } = data;
        const [{ topics }] = rows;
        return topics;
    }

    /**
     * Returns the list of queries currently running on the ksqlDB server.
     *
     * @return list of queries
     */
    async listQueries() {
        const { data } = await this.#executeAdminStatement("LIST QUERIES;", KsqldbClient.KSQL_ENDPOINT);
        const { rows } = data;
        const [{ queries }] = rows;
        return queries;
    }

    /**
     * Returns metadata about the ksqlDB stream or table of the provided name.
     *
     * @param sourceName stream or table name
     * @return metadata for stream or table
     */
    async describeSource(sourceName) {
        const { data } = await this.#executeAdminStatement(`DESCRIBE ${sourceName}; `, KsqldbClient.KSQL_ENDPOINT);
        const { rows } = data;
        const [{ sourceDescription }] = rows;
        return sourceDescription;
    }
};
