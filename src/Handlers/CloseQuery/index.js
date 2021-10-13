const StatementHandler = require("../Statement");

class CloseQueryHandler extends StatementHandler {
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
                            data: undefined,
                            error: undefined,
                            status: this.status,
                        });
                    } else {
                        try {
                            const parsedData = this.data ? JSON.parse(this.data) : undefined;

                            resolve({
                                data: undefined,
                                error: parsedData,
                                status: this.status,
                            });
                        } catch (parsingError) {
                            console.error("Error parsing close query error.");
                            reject(parsingError);
                        }
                    }
                }
            });
        });

        return this.handlePromise;
    }
}

module.exports = CloseQueryHandler;
