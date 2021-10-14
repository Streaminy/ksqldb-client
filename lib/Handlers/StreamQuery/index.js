"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

var Handler = require("../Handler");

var StreamQueryHandler = /*#__PURE__*/function (_Handler) {
  (0, _inherits2["default"])(StreamQueryHandler, _Handler);

  var _super = _createSuper(StreamQueryHandler);

  function StreamQueryHandler(callback) {
    var _this;

    (0, _classCallCheck2["default"])(this, StreamQueryHandler);
    _this = _super.call(this);
    _this.callback = callback;
    return _this;
  }

  (0, _createClass2["default"])(StreamQueryHandler, [{
    key: "parseRow",
    value: function parseRow(rawRow) {
      var row = {};
      var columnNames = this.metadata.columnNames;

      if (Array.isArray(rawRow)) {
        rawRow.forEach(function (value, index) {
          return row[columnNames[index]] = value;
        });
      }

      return row;
    }
  }, {
    key: "handleData",
    value: function handleData(dataChunk) {
      var callbackData = {
        status: this.status
      };

      if (this.status === 200) {
        // First data chunk will be the metadata
        // Next data chunks will be a row
        var data = JSON.parse(dataChunk);

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
  }, {
    key: "handleRequest",
    value: function handleRequest(request) {
      var _this2 = this;

      this.handlePromise = new Promise(function (resolve, reject) {
        request.on("response", _this2.handleResponse.bind(_this2));
        request.on("error", _this2.handleError.bind(_this2));
        request.on("data", _this2.handleData.bind(_this2));
        request.on("end", function () {
          if (_this2.error) {
            reject(new Error(_this2.error));
          } else {
            if (_this2.status === 200) {
              resolve({
                data: {
                  metadata: _this2.metadata
                },
                error: undefined,
                status: _this2.status
              });
            } else {
              try {
                var parsedData = JSON.parse(_this2.data);
                resolve({
                  data: undefined,
                  error: parsedData,
                  status: _this2.status
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
  }]);
  return StreamQueryHandler;
}(Handler);

module.exports = StreamQueryHandler;