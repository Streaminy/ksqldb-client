const Handler = require("../Handler");

class InsertStreamHandler extends Handler {
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
                        const [rowInsertData] = parsedData;
                        const { status } = rowInsertData;

                        if (this.status === 200 && status === "ok") {
                            resolve({
                                data: { rows: parsedData },
                                error: undefined,
                                status: this.status,
                            });
                        } else {
                            resolve({
                                data: undefined,
                                error: rowInsertData,
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

module.exports = InsertStreamHandler;
