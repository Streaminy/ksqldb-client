const Handler = require("../Handler");

class StatementHandler extends Handler {
    static EXECUTE_STATEMENT_REQUEST_ACCEPTED_DOC =
        "The ksqlDB server accepted the statement issued via executeStatement(), but the response " +
        "received is of an unexpected format. ";

    static EXECUTE_STATEMENT_USAGE_DOC =
        "The executeStatement() method is only " +
        "for 'CREATE', 'CREATE ... AS SELECT', 'DROP', 'TERMINATE', and 'INSERT INTO ... AS " +
        "SELECT' statements. ";

    checkResponse(parsedData) {
        if (Array.isArray(parsedData)) {
            const [ksqlEntity] = parsedData;
            const { commandId, commandSequenceNumber } = ksqlEntity;
            const ksqlEntityType = ksqlEntity["@type"];

            if (!commandId && !commandSequenceNumber) {
                switch (ksqlEntityType) {
                    case "tables":
                        throw new Error(
                            StatementHandler.EXECUTE_STATEMENT_USAGE_DOC + "Use the listTables() method instead."
                        );
                    case "streams":
                        throw new Error(
                            StatementHandler.EXECUTE_STATEMENT_USAGE_DOC + "Use the listStreams() method instead."
                        );
                    case "kafka_topics":
                        throw new Error(
                            StatementHandler.EXECUTE_STATEMENT_USAGE_DOC + "Use the listTopics() method instead."
                        );
                    case "queries":
                        throw new Error(
                            StatementHandler.EXECUTE_STATEMENT_USAGE_DOC + "Use the listQueries() method instead."
                        );
                    case "sourceDescription":
                        throw new Error(
                            StatementHandler.EXECUTE_STATEMENT_USAGE_DOC + "Use the describeSource() method instead."
                        );
                    default:
                        throw new Error("Unexpected server response type. Response: " + JSON.stringify(ksqlEntity));
                }
            }
        } else {
            throw new Error(StatementHandler.EXECUTE_STATEMENT_REQUEST_ACCEPTED_DOC);
        }
    }

    handleRequest(request) {
        this.handlePromise = new Promise((resolve, reject) => {
            request.on("response", this.handleResponse.bind(this));

            request.on("error", this.handleError.bind(this));

            request.on("data", this.handleData.bind(this));

            request.on("end", () => {
                if (this.error) {
                    reject(new Error(this.error));
                } else {
                    try {
                        const parsedData = JSON.parse(this.data);

                        if (this.status === 200) {
                            this.checkResponse(parsedData);
                            resolve({
                                data: {
                                    rows: parsedData,
                                },
                                error: undefined,
                                status: this.status,
                            });
                        } else {
                            resolve({
                                data: undefined,
                                error: parsedData,
                                status: this.status,
                            });
                        }
                    } catch (processingError) {
                        reject(processingError);
                    }
                }
            });
        });

        return this.handlePromise;
    }
}

module.exports = StatementHandler;
