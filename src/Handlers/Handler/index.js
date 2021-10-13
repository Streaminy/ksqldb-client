class Handler {
    status;
    metadata;
    error;
    data;
    handlePromise;

    constructor() {
        this.data = "";
    }

    handleResponse(headers) {
        if (typeof headers === "object") {
            this.status = headers[":status"];
        }
    }

    handleError(requestError) {
        this.error = requestError;
    }

    handleData(dataChunk) {
        this.data += dataChunk;
    }

    handleRequest() {
        throw new Error("Implement method.");
    }
}

module.exports = Handler;
