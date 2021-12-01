const assert = require("assert");
const KsqldbClient = require("../src");
const { StatementHandler } = require("../src/Handlers");

const clientParams = {
    host: process.env.KSQLDB_HOST,
    port: process.env.KSQLDB_PORT,
    timeout: 10000,
};

const STREAM_NAME = "test_stream_words";
const TABLE_NAME = "test_table_agg_words";
const TOPIC_NAME = "test_topic_words";

const default_timeout = 5000;

describe("KsqlDB Client integration test", () => {
    it("Should connect and disconnect from a source", async () => {
        const client = new KsqldbClient(clientParams);
        await client.connect();
        await client.disconnect();
    }).timeout(default_timeout);

    it("Should throw a timeout error connecting to an invalid source", async () => {
        /**
         * There is a thing about this test.
         * When the client timeout and gets destroyed the connect request will not end.
         * Leaving open a connection till get internal timeout or proccess end (60ms on MacOS).
         */
        const client = new KsqldbClient({
            host: "127.0.0.",
            timeout: 1000,
        });

        let errorMessage = "";

        try {
            await client.connect();
        } catch (err) {
            errorMessage = err.message;
        }

        assert(errorMessage === "Connection timeout.");

        await client.disconnect();
    });

    it("Should throw an error connecting to an invalid port in host", async () => {
        const client = new KsqldbClient({
            host: "127.0.0.1",
            port: 22,
            timeout: 1000,
        });

        let errorMessage = "";

        try {
            await client.connect();
        } catch (err) {
            errorMessage = err.message;
        }

        assert(errorMessage === "connect ECONNREFUSED 127.0.0.1:22");
        await client.disconnect();
    });

    it("Should throw error on not connected client", async () => {
        const client = new KsqldbClient();
        let errorMessage = "";

        try {
            await client.listStreams();
        } catch (streamsErr) {
            errorMessage = streamsErr.message;
        }

        assert(errorMessage === "Client is not connected.");
    });

    it("Should throw error on a disconnected client", async () => {
        const client = new KsqldbClient(clientParams);
        await client.connect();

        let errorMessage = "";

        try {
            client.disconnect();
            await client.listStreams();
        } catch (streamsErr) {
            errorMessage = streamsErr.message;
        }

        assert(errorMessage === "The session has been destroyed");
    });

    it("Should run successfully a wrong custom query", async () => {
        const client = new KsqldbClient(clientParams);
        await client.connect();

        const { error } = await client.query("SELECT * FROM;");
        assert(error !== undefined && error.error_code === 40001);

        await client.disconnect();
    }).timeout(default_timeout);

    it("Should run successfully a create stream statement using session varaibles", async () => {
        const client = new KsqldbClient(clientParams);
        await client.connect();

        const statement = `
            CREATE STREAM IF NOT EXISTS \${STREAM_NAME} (
                word VARCHAR
            ) WITH (
                KAFKA_TOPIC='\${TOPIC_NAME}',
                PARTITIONS=1,
                REPLICAS=1,
                VALUE_FORMAT='JSON'
            );
        `;
        const {
            data: queryData,
            status,
            error,
        } = await client.executeStatement(statement, {
            sessionVariables: { STREAM_NAME: STREAM_NAME, TOPIC_NAME: TOPIC_NAME },
        });

        assert(status === 200 && error === undefined);

        const { rows } = queryData;
        assert(Array.isArray(rows));
        assert(rows.length === 1);

        await client.disconnect();
    }).timeout(default_timeout);

    it("Should throw exception while trying to execute two statements at the same time", async () => {
        const client = new KsqldbClient(clientParams);
        await client.connect();

        let errorMessage = "";

        try {
            const statement = `
                CREATE TABLE IF NOT EXISTS ${TABLE_NAME} AS
                SELECT word, COUNT(*)
                FROM ${STREAM_NAME}
                GROUP BY word
                EMIT CHANGES;
                CREATE TABLE IF NOT EXISTS ${TABLE_NAME} AS
                SELECT word, COUNT(*)
                FROM ${STREAM_NAME}
                GROUP BY word
                EMIT CHANGES;
            `;
            await client.executeStatement(statement);
        } catch (createErr) {
            errorMessage = createErr.message;
        }

        assert(errorMessage === "executeStatement() may only be used to execute one statement at a time.");

        await client.disconnect();
    }).timeout(default_timeout);

    it("Should return error while trying to execute a query on a table that does not exists.", async () => {
        const client = new KsqldbClient(clientParams);
        await client.connect();

        const query = `
            SELECT *
            FROM TEST_INVALID_TABLE_NOT_EXISTS_231555555555
            WHERE WORD in ('tree', 'wind');
        `;
        const { status, error } = await client.query(query);
        assert(error !== undefined);
        assert(status === 400);

        await client.disconnect();
    }).timeout(default_timeout);

    it("Should run successfully a create table statement", async () => {
        const client = new KsqldbClient(clientParams);
        await client.connect();

        const statement = `
            CREATE TABLE IF NOT EXISTS ${TABLE_NAME} AS
            SELECT word, COUNT(*)
            FROM ${STREAM_NAME}
            GROUP BY word
            EMIT CHANGES;
        `;
        const { data: queryData, status, error } = await client.executeStatement(statement);

        assert(status === 200 && error === undefined);
        const { rows } = queryData;
        assert(Array.isArray(rows) && rows.length === 1);

        await client.disconnect();
    }).timeout(default_timeout);

    it("Should insert a row into a stream", async () => {
        const client = new KsqldbClient(clientParams);
        await client.connect();

        const { data, status: insertStatus } = await client.insertInto(STREAM_NAME, {
            word: "tree",
        });
        const { rows } = data;
        const [{ status }] = rows;

        assert(insertStatus === 200 && status === "ok");

        const { data: secondInsertData, status: secondInsertStatus } = await client.insertInto(STREAM_NAME, {
            word: "wind",
        });
        const { rows: secondInsertRows } = secondInsertData;
        const [{ status: secondStatus }] = secondInsertRows;

        assert(secondInsertStatus === 200 && secondStatus === "ok");

        await client.disconnect();
    }).timeout(default_timeout);

    it("Should run successfully a custom query", async () => {
        // Sleep 2sec. Wait table creation.
        await new Promise((resolve) => {
            setTimeout(() => {
                resolve("Timeout");
            }, 2000);
        });

        const client = new KsqldbClient(clientParams);
        await client.connect();

        const query = `
            SELECT *
            FROM ${TABLE_NAME}
            WHERE WORD in ('tree', 'wind');
        `;
        const { data: queryData, error } = await client.query(query);
        assert(error === undefined);

        const { rows, metadata } = queryData;
        const expectedColumnNames = ["WORD", "KSQL_COL_0"];
        assert(Array.isArray(rows));
        metadata.columnNames.forEach((columnName) => {
            assert(expectedColumnNames.find((x) => x === columnName) !== undefined);
        });

        await client.disconnect();
    }).timeout(default_timeout);

    it("Should run successfully a custom query with session variables", async () => {
        // Sleep 2sec. Wait table creation.
        await new Promise((resolve) => {
            setTimeout(() => {
                resolve("Timeout");
            }, 2000);
        });

        const client = new KsqldbClient(clientParams);
        await client.connect();

        const query = "SELECT * FROM ${TABLE_NAME} WHERE WORD in ('${FIRST_WORD}', '${SECOND_WORD}');";
        const { data: queryData, error } = await client.query(query, {
            sessionVariables: { TABLE_NAME: TABLE_NAME, FIRST_WORD: "tree", SECOND_WORD: "wind" },
        });
        assert(error === undefined);

        const { rows, metadata } = queryData;
        const expectedColumnNames = ["WORD", "KSQL_COL_0"];
        assert(Array.isArray(rows));
        metadata.columnNames.forEach((columnName) => {
            assert(expectedColumnNames.find((x) => x === columnName) !== undefined);
        });

        await client.disconnect();
    }).timeout(default_timeout);

    it("Should run successfully a streaming custom query", async () => {
        const client = new KsqldbClient(clientParams);
        await client.connect();
        let terminatingQuery = false;

        const cb = async (cbData) => {
            const { metadata } = cbData;
            const { queryId } = metadata;
            if (queryId && terminatingQuery === false) {
                terminatingQuery = true;

                const results = await client.terminatePushQuery(queryId);
                assert(results.status === 200);
                await client.disconnect();
            }
        };

        const streamQueryResults = await client.streamQuery(`SELECT * FROM ${TABLE_NAME} EMIT CHANGES;`, cb);
        const { error, status } = streamQueryResults;
        assert(error === undefined && status === 200);

        await client.disconnect();
    }).timeout(default_timeout);

    it("Should run successfully a streaming custom query using session variables", async () => {
        const client = new KsqldbClient(clientParams);
        await client.connect();
        let terminatingQuery = false;

        const cb = async (cbData) => {
            const { metadata } = cbData;
            const { queryId } = metadata;
            if (queryId && terminatingQuery === false) {
                terminatingQuery = true;

                const results = await client.terminatePushQuery(queryId);
                assert(results.status === 200);
                await client.disconnect();
            }
        };

        const streamQueryResults = await client.streamQuery("SELECT * FROM ${TABLE_NAME} EMIT CHANGES;", cb, {
            sessionVariables: { TABLE_NAME: TABLE_NAME },
        });
        const { error, status } = streamQueryResults;
        assert(error === undefined && status === 200);

        await client.disconnect();
    }).timeout(default_timeout);

    it("Should terminate a push query that does not exists and return an error.", async () => {
        const client = new KsqldbClient(clientParams);
        await client.connect();
        const pushQueryResults = await client.terminatePushQuery("WrongId");
        assert(pushQueryResults.status === 400 && pushQueryResults.error !== undefined);
        await client.disconnect();
    }).timeout(default_timeout);

    it("Should run successfully a streaming query and a query at the same time", async () => {
        const client = new KsqldbClient(clientParams);
        await client.connect();
        let streamQueryId;

        const cb = async (cbData) => {
            const { metadata } = cbData;
            const { queryId } = metadata;
            streamQueryId = queryId;
        };

        client.streamQuery(`SELECT * FROM ${TABLE_NAME} EMIT CHANGES;`, cb).then((streamQuery) => {
            assert(streamQuery.error === undefined);
        });
        const { data, error: queryError } = await client.query(`SELECT * FROM ${TABLE_NAME} WHERE word ='tree';`);
        assert(queryError === undefined);
        const { rows, metadata } = data;
        assert(Array.isArray(rows) && metadata !== undefined);

        setTimeout(async () => {
            if (streamQueryId) {
                const results = await client.terminatePushQuery(streamQueryId);
                assert(results.status === 200);
                await client.disconnect();
            } else {
                await client.disconnect();
                throw Error("No query id");
            }
        }, 2000);
    }).timeout(default_timeout);

    it("Should retrieve tables", async () => {
        const client = new KsqldbClient(clientParams);
        await client.connect();

        const tables = await client.listTables();
        assert(tables.length > 0 && tables.find((x) => x.name === TABLE_NAME.toUpperCase()) !== undefined);

        await client.disconnect();
    }).timeout(default_timeout);

    it("Should throw error while listing tables using executeStatement", async () => {
        const client = new KsqldbClient(clientParams);
        await client.connect();

        let errorMessage = "";

        try {
            const statement = `
                LIST TABLES;
            `;
            await client.executeStatement(statement);
        } catch (error) {
            errorMessage = error.message;
        }

        assert(errorMessage === StatementHandler.EXECUTE_STATEMENT_USAGE_DOC + "Use the listTables() method instead.");
        await client.disconnect();
    }).timeout(default_timeout);

    it("Should retrieve streams", async () => {
        const client = new KsqldbClient(clientParams);
        await client.connect();

        const streams = await client.listStreams();
        assert(streams.length > 0 && streams.find((x) => x.name === STREAM_NAME.toUpperCase()) !== undefined);

        await client.disconnect();
    }).timeout(default_timeout);

    it("Should throw error while listing streams using executeStatement", async () => {
        const client = new KsqldbClient(clientParams);
        await client.connect();

        let errorMessage = "";

        try {
            const statement = `
                LIST STREAMS;
            `;
            await client.executeStatement(statement);
        } catch (error) {
            errorMessage = error.message;
        }

        assert(errorMessage === StatementHandler.EXECUTE_STATEMENT_USAGE_DOC + "Use the listStreams() method instead.");
        await client.disconnect();
    }).timeout(default_timeout);

    it("Should retrieve topics", async () => {
        const client = new KsqldbClient(clientParams);
        await client.connect();

        const topics = await client.listTopics();
        assert(topics.length > 0 && topics.find((x) => x.name === TOPIC_NAME) !== undefined);

        await client.disconnect();
    }).timeout(default_timeout);

    it("Should throw error while listing topics using executeStatement", async () => {
        const client = new KsqldbClient(clientParams);
        await client.connect();

        let errorMessage = "";

        try {
            const statement = `
                LIST TOPICS;
            `;
            await client.executeStatement(statement);
        } catch (error) {
            errorMessage = error.message;
        }

        assert(errorMessage === StatementHandler.EXECUTE_STATEMENT_USAGE_DOC + "Use the listTopics() method instead.");
        await client.disconnect();
    }).timeout(default_timeout);

    it("Should retrieve queries", async () => {
        const client = new KsqldbClient(clientParams);
        await client.connect();

        const queries = await client.listQueries();
        assert(queries.length > 0);

        await client.disconnect();
    }).timeout(default_timeout);

    it("Should throw error while listing queries using executeStatement", async () => {
        const client = new KsqldbClient(clientParams);
        await client.connect();

        let errorMessage = "";

        try {
            const statement = "LIST QUERIES;";
            await client.executeStatement(statement);
        } catch (error) {
            errorMessage = error.message;
        }

        assert(errorMessage === StatementHandler.EXECUTE_STATEMENT_USAGE_DOC + "Use the listQueries() method instead.");
        await client.disconnect();
    }).timeout(default_timeout);

    it("Should describe a source", async () => {
        const client = new KsqldbClient(clientParams);
        await client.connect();

        const sourceDescription = await client.describeSource(STREAM_NAME);

        assert(sourceDescription.name === STREAM_NAME.toUpperCase());

        await client.disconnect();
    }).timeout(default_timeout);

    it("Should throw error while describing a source using executeStatement", async () => {
        const client = new KsqldbClient(clientParams);
        await client.connect();

        let errorMessage = "";

        try {
            const statement = `DESCRIBE ${STREAM_NAME};`;
            await client.executeStatement(statement);
        } catch (error) {
            errorMessage = error.message;
        }

        assert(
            errorMessage === StatementHandler.EXECUTE_STATEMENT_USAGE_DOC + "Use the describeSource() method instead."
        );
        await client.disconnect();
    }).timeout(default_timeout);

    it("Should drop testing tables, streams and topics", async () => {
        const client = new KsqldbClient(clientParams);
        await client.connect();

        const dropTableStatement = `
            DROP TABLE IF EXISTS ${TABLE_NAME};
        `;
        const { status: dropTableStatus } = await client.executeStatement(dropTableStatement);
        assert(dropTableStatus === 200);

        const dropStreamStatement = `
            DROP STREAM IF EXISTS ${STREAM_NAME};
        `;
        const { status: dropStreamStatus } = await client.executeStatement(dropStreamStatement);
        assert(dropStreamStatus === 200);

        await client.disconnect();
    }).timeout(default_timeout);
});
