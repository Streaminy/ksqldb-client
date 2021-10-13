"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

var Handler = require("../Handler");

var InsertStreamHandler = /*#__PURE__*/function (_Handler) {
  (0, _inherits2["default"])(InsertStreamHandler, _Handler);

  var _super = _createSuper(InsertStreamHandler);

  function InsertStreamHandler() {
    (0, _classCallCheck2["default"])(this, InsertStreamHandler);
    return _super.apply(this, arguments);
  }

  (0, _createClass2["default"])(InsertStreamHandler, [{
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

              var _parsedData = (0, _slicedToArray2["default"])(parsedData, 1),
                  rowInsertData = _parsedData[0];

              var status = rowInsertData.status;

              if (_this.status === 200 && status === "ok") {
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
                  error: rowInsertData,
                  status: _this.status
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
  }]);
  return InsertStreamHandler;
}(Handler);

module.exports = InsertStreamHandler;