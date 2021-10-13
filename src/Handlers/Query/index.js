const Handler = require("../Handler");

class QueryHandler extends Handler {
    parseSuccessData(parsedData) {
        const metadata = parsedData.shift();
        const { columnNames } = metadata;
        const rows = [];

        parsedData.forEach((rawRow) => {
            if (Array.isArray(rawRow)) {
                const row = {};

                rawRow.forEach((value, index) => {
                    row[columnNames[index]] = value;
                });

                rows.push(row);
            }
        });

        return {
            metadata,
            rows,
        };
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
                            const data = this.parseSuccessData(parsedData);

                            resolve({
                                data,
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
                    } catch (parsingError) {
                        console.error("Error parsing query data.");
                        reject(parsingError);
                    }
                }
            });
        });

        return this.handlePromise;
    }
}

module.exports = QueryHandler;
