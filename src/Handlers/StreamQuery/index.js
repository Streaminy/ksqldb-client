const Handler = require("../Handler");

class StreamQueryHandler extends Handler {
    constructor(callback) {
        super();
        this.callback = callback;
    }

    parseRow(rawRow) {
        const row = {};
        const { columnNames } = this.metadata;

        if (Array.isArray(rawRow)) {
            rawRow.forEach((value, index) => (row[columnNames[index]] = value));
        }

        return row;
    }

    handleData(dataChunk) {
        const callbackData = {
            status: this.status,
        };

        if (this.status === 200) {
            // First data chunk will be the metadata
            // Next data chunks will be a row
            const data = JSON.parse(dataChunk);

            if (!this.metadata) {
                this.metadata = data;
            } else if (data !== "") {
                callbackData.rows = [this.parseRow(data)];
            } else {
                callbackData.rows = [];
            }

            callbackData.metadata = this.metadata;
        } else {
            this.data = dataChunk;
        }

        if (this.callback) {
            this.callback(callbackData);
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
                    if (this.status === 200) {
                        resolve({
                            data: {
                                metadata: this.metadata,
                            },
                            error: undefined,
                            status: this.status,
                        });
                    } else {
                        try {
                            const parsedData = JSON.parse(this.data);
                            resolve({
                                data: undefined,
                                error: parsedData,
                                status: this.status,
                            });
                        } catch (parsingError) {
                            console.error("Error parsing stream query error.");
                            reject(parsingError);
                        }
                    }
                }
            });
        });

        return this.handlePromise;
    }
}

module.exports = StreamQueryHandler;
