"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

var Handler = require("../Handler");

var StatementHandler = /*#__PURE__*/function (_Handler) {
  (0, _inherits2["default"])(StatementHandler, _Handler);

  var _super = _createSuper(StatementHandler);

  function StatementHandler() {
    (0, _classCallCheck2["default"])(this, StatementHandler);
    return _super.apply(this, arguments);
  }

  (0, _createClass2["default"])(StatementHandler, [{
    key: "checkResponse",
    value: function checkResponse(parsedData) {
      if (Array.isArray(parsedData)) {
        var _parsedData = (0, _slicedToArray2["default"])(parsedData, 1),
            ksqlEntity = _parsedData[0];

        var commandId = ksqlEntity.commandId,
            commandSequenceNumber = ksqlEntity.commandSequenceNumber;
        var ksqlEntityType = ksqlEntity["@type"];

        if (!commandId && !commandSequenceNumber) {
          switch (ksqlEntityType) {
            case "tables":
              throw new Error(StatementHandler.EXECUTE_STATEMENT_USAGE_DOC + "Use the listTables() method instead.");

            case "streams":
              throw new Error(StatementHandler.EXECUTE_STATEMENT_USAGE_DOC + "Use the listStreams() method instead.");

            case "kafka_topics":
              throw new Error(StatementHandler.EXECUTE_STATEMENT_USAGE_DOC + "Use the listTopics() method instead.");

            case "queries":
              throw new Error(StatementHandler.EXECUTE_STATEMENT_USAGE_DOC + "Use the listQueries() method instead.");

            case "sourceDescription":
              throw new Error(StatementHandler.EXECUTE_STATEMENT_USAGE_DOC + "Use the describeSource() method instead.");

            default:
              throw new Error("Unexpected server response type. Response: " + JSON.stringify(ksqlEntity));
          }
        }
      } else {
        throw new Error(StatementHandler.EXECUTE_STATEMENT_REQUEST_ACCEPTED_DOC);
      }
    }
  }, {
    key: "handleRequest",
    value: function handleRequest(request) {
      var _this = this;

      this.handlePromise = new Promise(function (resolve, reject) {
        request.on("response", _this.handleResponse.bind(_this));
        request.on("error", _this.handleError.bind(_this));
        request.on("data", _this.handleData.bind(_this));
        request.on("end", function () {
          if (_this.error) {
            reject(new Error(_this.error));
          } else {
            try {
              var parsedData = JSON.parse(_this.data);

              if (_this.status === 200) {
                _this.checkResponse(parsedData);

                resolve({
                  data: {
                    rows: parsedData
                  },
                  error: undefined,
                  status: _this.status
                });
              } else {
                resolve({
                  data: undefined,
                  error: parsedData,
                  status: _this.status
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
  }]);
  return StatementHandler;
}(Handler);

(0, _defineProperty2["default"])(StatementHandler, "EXECUTE_STATEMENT_REQUEST_ACCEPTED_DOC", "The ksqlDB server accepted the statement issued via executeStatement(), but the response " + "received is of an unexpected format. ");
(0, _defineProperty2["default"])(StatementHandler, "EXECUTE_STATEMENT_USAGE_DOC", "The executeStatement() method is only " + "for 'CREATE', 'CREATE ... AS SELECT', 'DROP', 'TERMINATE', and 'INSERT INTO ... AS " + "SELECT' statements. ");
module.exports = StatementHandler;