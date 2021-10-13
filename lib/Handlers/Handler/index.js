"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var Handler = /*#__PURE__*/function () {
  function Handler() {
    (0, _classCallCheck2["default"])(this, Handler);
    (0, _defineProperty2["default"])(this, "status", void 0);
    (0, _defineProperty2["default"])(this, "metadata", void 0);
    (0, _defineProperty2["default"])(this, "error", void 0);
    (0, _defineProperty2["default"])(this, "data", void 0);
    (0, _defineProperty2["default"])(this, "handlePromise", void 0);
    this.data = "";
  }

  (0, _createClass2["default"])(Handler, [{
    key: "handleResponse",
    value: function handleResponse(headers) {
      if ((0, _typeof2["default"])(headers) === "object") {
        this.status = headers[":status"];
      }
    }
  }, {
    key: "handleError",
    value: function handleError(requestError) {
      this.error = requestError;
    }
  }, {
    key: "handleData",
    value: function handleData(dataChunk) {
      this.data += dataChunk;
    }
  }, {
    key: "handleRequest",
    value: function handleRequest() {
      throw new Error("Implement method.");
    }
  }]);
  return Handler;
}();

module.exports = Handler;