"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _classPrivateFieldGet4 = _interopRequireDefault(require("@babel/runtime/helpers/classPrivateFieldGet"));

var _classPrivateFieldSet2 = _interopRequireDefault(require("@babel/runtime/helpers/classPrivateFieldSet"));

var _class, _http2Session, _options, _asyncConnection, _DEFAULT_HOST, _DEFAULT_HOST_PORT, _DEFAULT_ALPN, _DEFAULT_TIMEOUT, _QUOTED_STRING_OR_IDENTIFIER, _buildHostUrl, _buildBasicAuth, _request, _executeAdminStatement, _temp;

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _classPrivateMethodInitSpec(obj, privateSet) { _checkPrivateRedeclaration(obj, privateSet); privateSet.add(obj); }

function _classPrivateFieldInitSpec(obj, privateMap, value) { _checkPrivateRedeclaration(obj, privateMap); privateMap.set(obj, value); }

function _checkPrivateRedeclaration(obj, privateCollection) { if (privateCollection.has(obj)) { throw new TypeError("Cannot initialize the same private elements twice on an object"); } }

function _classPrivateMethodGet(receiver, privateSet, fn) { if (!privateSet.has(receiver)) { throw new TypeError("attempted to get private field on non-instance"); } return fn; }

/**
 * Http2: https://github.com/nodejs/http2
 * Api docs: https://github.com/nodejs/http2/blob/master/doc/api/http2.md
 */
var http2 = require("http2");

var _require = require("./Handlers"),
    QueryHandler = _require.QueryHandler,
    StatementHandler = _require.StatementHandler,
    AdminStatementHandler = _require.AdminStatementHandler,
    StreamQueryHandler = _require.StreamQueryHandler,
    CloseQueryHandler = _require.CloseQueryHandler,
    InsertStreamHandler = _require.InsertStreamHandler;
/**
 * 5) Usernames of the client may wish to receive result rows in different ways:
 *  - Do not block. Rather, perform an action asynchronously on each new row as it arrives (Pull Query DONE)
 *  - Block until the next row arrives
 *  - Block until all rows have arrived. This only makes sense in the context of pull queries and push queries with LIMIT clauses. (Pull Query DONE)
 * 6) (ASK) The client must expose #options for specifying the address of the ksqlDB server to connect to.
 *  - Support for TLS-enabled ksqlDB servers
 *  - Support for mutual-TLS-enabled ksqlDB servers
 */

/**
 * Simple KsqlDB Node.JS client made with love by Streaminy.io
 */


module.exports = (_temp = (_http2Session = /*#__PURE__*/new WeakMap(), _options = /*#__PURE__*/new WeakMap(), _asyncConnection = /*#__PURE__*/new WeakMap(), _DEFAULT_HOST = /*#__PURE__*/new WeakMap(), _DEFAULT_HOST_PORT = /*#__PURE__*/new WeakMap(), _DEFAULT_ALPN = /*#__PURE__*/new WeakMap(), _DEFAULT_TIMEOUT = /*#__PURE__*/new WeakMap(), _QUOTED_STRING_OR_IDENTIFIER = /*#__PURE__*/new WeakMap(), _buildHostUrl = /*#__PURE__*/new WeakSet(), _buildBasicAuth = /*#__PURE__*/new WeakSet(), _request = /*#__PURE__*/new WeakSet(), _executeAdminStatement = /*#__PURE__*/new WeakSet(), _class = /*#__PURE__*/function () {
  /**
   * Default values
   */

  /**
   * Endpoints
   */

  /**
   * Execute statement regex
   */
  function KsqldbClient(options) {
    (0, _classCallCheck2["default"])(this, KsqldbClient);

    _classPrivateMethodInitSpec(this, _executeAdminStatement);

    _classPrivateMethodInitSpec(this, _request);

    _classPrivateMethodInitSpec(this, _buildBasicAuth);

    _classPrivateMethodInitSpec(this, _buildHostUrl);

    _classPrivateFieldInitSpec(this, _http2Session, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldInitSpec(this, _options, {
      writable: true,
      value: void 0
    });

    _classPrivateFieldInitSpec(this, _asyncConnection, {
      writable: true,
      value: void 0
    });

    (0, _defineProperty2["default"])(this, "connected", void 0);

    _classPrivateFieldInitSpec(this, _DEFAULT_HOST, {
      writable: true,
      value: "http://localhost"
    });

    _classPrivateFieldInitSpec(this, _DEFAULT_HOST_PORT, {
      writable: true,
      value: 8088
    });

    _classPrivateFieldInitSpec(this, _DEFAULT_ALPN, {
      writable: true,
      value: []
    });

    _classPrivateFieldInitSpec(this, _DEFAULT_TIMEOUT, {
      writable: true,
      value: 25000
    });

    _classPrivateFieldInitSpec(this, _QUOTED_STRING_OR_IDENTIFIER, {
      writable: true,
      value: "(`([^`]*|(``))*`)|('([^']*|(''))*')"
    });

    (0, _classPrivateFieldSet2["default"])(this, _options, options || {});
    this.connected = false;
  }
  /**
   * Checks if the host URL starts with http:// or https://.
   * If nots it will append http:// by default.
   * @param {*} host
   * @returns
   */


  (0, _createClass2["default"])(KsqldbClient, [{
    key: "connect",
    value:
    /**
     * Connects the client to the KsqlDB instance.
     * @returns a promise that completes once the client connects.
     */
    function connect() {
      var _this = this;

      (0, _classPrivateFieldSet2["default"])(this, _asyncConnection, new Promise(function (resolve, reject) {
        try {
          var _classPrivateFieldGet2 = (0, _classPrivateFieldGet4["default"])(_this, _options),
              authorization = _classPrivateFieldGet2.authorization,
              host = _classPrivateFieldGet2.host,
              port = _classPrivateFieldGet2.port,
              alpnProtocols = _classPrivateFieldGet2.alpnProtocols,
              timeout = _classPrivateFieldGet2.timeout,
              sessionOptions = _classPrivateFieldGet2.sessionOptions;

          var additionalOptions = sessionOptions || {};

          var hostUrl = _classPrivateMethodGet(_this, _buildHostUrl, _buildHostUrl2).call(_this, host);

          (0, _classPrivateFieldSet2["default"])(_this, _http2Session, http2.connect("".concat(hostUrl, ":").concat(port || (0, _classPrivateFieldGet4["default"])(_this, _DEFAULT_HOST_PORT)), _objectSpread(_objectSpread({}, additionalOptions), {}, {
            timeout: timeout || (0, _classPrivateFieldGet4["default"])(_this, _DEFAULT_TIMEOUT),
            ca: authorization && (0, _typeof2["default"])(authorization.ssl) === "object" && authorization.ssl.ca,
            cert: authorization && (0, _typeof2["default"])(authorization.ssl) === "object" && authorization.ssl.cert,
            key: authorization && (0, _typeof2["default"])(authorization.ssl) === "object" && authorization.ssl.key,
            ALPNProtocols: alpnProtocols || (0, _classPrivateFieldGet4["default"])(_this, _DEFAULT_ALPN)
          })));
          (0, _classPrivateFieldGet4["default"])(_this, _http2Session).setTimeout(timeout || (0, _classPrivateFieldGet4["default"])(_this, _DEFAULT_TIMEOUT), function () {
            if (_this.connected === false) {
              var timeoutError = new Error("Connection timeout.");
              reject(timeoutError);
              (0, _classPrivateFieldGet4["default"])(_this, _http2Session).destroy(timeoutError);
            }
          });
          (0, _classPrivateFieldGet4["default"])(_this, _http2Session).on("connect", function () {
            _this.connected = true;
            resolve();
          });
          (0, _classPrivateFieldGet4["default"])(_this, _http2Session).on("error", function (http2ClientErr) {
            console.error("Error on Http2 client.", http2ClientErr);
            reject(http2ClientErr);
          });
        } catch (errBuildingConnection) {
          reject(errBuildingConnection);
        }
      }));
      return (0, _classPrivateFieldGet4["default"])(this, _asyncConnection);
    }
    /**
     * Disconnects client from KsqlDB instance.
     */

  }, {
    key: "disconnect",
    value: function disconnect() {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        _this2.connected = false;

        if ((0, _classPrivateFieldGet4["default"])(_this2, _http2Session)) {
          if ((0, _classPrivateFieldGet4["default"])(_this2, _http2Session).destroyed) {
            resolve();
            return;
          }

          (0, _classPrivateFieldGet4["default"])(_this2, _http2Session).destroy();
          resolve();
        } else {
          reject(new Error("No client connected."));
        }
      });
    }
    /**
     * Builds basic authorization to interact with KsqlDB.
     * @returns the encoded authorization using constructor data.
     */

  }, {
    key: "countStatements",
    value:
    /**
     * This is replicates Java KslqDB Client Code in class DdlDmlRequestValidators
     * Counts the number of sql statements in a string by
     *  1. Removing all of the sql strings and identifiers
     *  2. Splitting the remaining substrings by ';'. The -1 argument in the split
     *     function call ensures that each ';' will always have two partitions surrounding it, so that
     *     the number of partitions is the same whether or not the final ';' has whitespace after it.
     *  3. Counting the partitions
     * @param sql a string containing sql statements
     * @return the number of sql statements in the string
     */
    function countStatements(statement) {
      return statement.split((0, _classPrivateFieldGet4["default"])(this, _QUOTED_STRING_OR_IDENTIFIER)).map(function (part) {
        return part.split(";", -1).length - 1;
      }).reduce(function (sum, partLength) {
        return sum + partLength;
      }, 0);
    }
    /**
     * Validates statements
     * @param {*} statement
     */

  }, {
    key: "validateExecuteStatementRequest",
    value: function validateExecuteStatementRequest(statement) {
      if (statement.indexOf(";") === -1) {
        throw new Error("Missing semicolon in SQL for executeStatement() request.");
      }

      if (this.countStatements(statement) > 1) {
        throw new Error("executeStatement() may only be used to execute one statement at a time.");
      }
    }
    /**
     * This method may be used to issue pull queries.
     *
     * Sends a SQL request to the ksqlDB server. This method supports 'CREATE', 'CREATE ... AS
     * SELECT', 'DROP', 'TERMINATE', and 'INSERT INTO ... AS SELECT' statements.
     *
     * @param {string} statement of query to execute
     * @param {Object} optionalExtraParams like streamsProperties, sessionVariables or commandSequenceNumber
     * @param {string} path of KsqlDB endpoint
     * @return a promise that completes once the server response is received
     */

  }, {
    key: "executeStatement",
    value: function () {
      var _executeStatement = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(statement, optionalExtraParams, path) {
        var body, handlerMap, requestHandler, buffer, requestPromise;
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!(0, _classPrivateFieldGet4["default"])(this, _asyncConnection)) {
                  _context.next = 17;
                  break;
                }

                _context.next = 3;
                return (0, _classPrivateFieldGet4["default"])(this, _asyncConnection);

              case 3:
                if (!path || path === KsqldbClient.KSQL_ENDPOINT) {
                  this.validateExecuteStatementRequest(statement);
                }

                body = {};

                if (optionalExtraParams) {
                  body = _objectSpread({}, optionalExtraParams);
                }

                if (statement) {
                  body = _objectSpread(_objectSpread({}, body), {}, {
                    ksql: statement
                  });
                }

                handlerMap = {};
                handlerMap[KsqldbClient.CLOSE_QUERY_ENDPOINT] = CloseQueryHandler;
                handlerMap[KsqldbClient.KSQL_ENDPOINT] = StatementHandler;
                handlerMap[KsqldbClient.INSERTS_ENDPOINT] = InsertStreamHandler;
                requestHandler = handlerMap[path] ? new handlerMap[path]() : new StatementHandler();
                /**
                 * Build request buffer
                 */

                buffer = Buffer.from(JSON.stringify(body));
                requestPromise = _classPrivateMethodGet(this, _request, _request2).call(this, path || KsqldbClient.KSQL_ENDPOINT, buffer, requestHandler);
                /**
                 * If the query has a bad query it will return successfuly. Then whoever pick the answer
                 * needs to validate the response.
                 */

                return _context.abrupt("return", requestPromise);

              case 17:
                throw new Error("Client is not connected.");

              case 18:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function executeStatement(_x, _x2, _x3) {
        return _executeStatement.apply(this, arguments);
      }

      return executeStatement;
    }()
    /**
     * This method may be used to issue pull queries.
     *
     * Sends a SQL request to the ksqlDB server. This method supports 'CREATE', 'CREATE ... AS
     * SELECT', 'DROP', 'TERMINATE', and 'INSERT INTO ... AS SELECT' statements.
     *
     * @param {string} statement of query to execute
     * @param {string} path of KsqlDB endpoint
     * @return a promise that completes once the server response is received
     */

  }, {
    key: "query",
    value:
    /**
     * This method may be used to issue pull queries.
     * @param {string} statement of query to execute
     * @param {Object} optionalExtraParams like streamsProperties, sessionVariables or commandSequenceNumber
     *
     * @return a promise that completes once the server response is received
     */
    function () {
      var _query2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(_query, optionalExtraParams) {
        var body, buffer, requestHandler, requestPromise;
        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (!(0, _classPrivateFieldGet4["default"])(this, _asyncConnection)) {
                  _context2.next = 12;
                  break;
                }

                _context2.next = 3;
                return (0, _classPrivateFieldGet4["default"])(this, _asyncConnection);

              case 3:
                body = {};

                if (optionalExtraParams) {
                  body = _objectSpread({}, optionalExtraParams);
                }

                body = _objectSpread(_objectSpread({}, body), {}, {
                  sql: _query
                });
                buffer = Buffer.from(JSON.stringify(body));
                requestHandler = new QueryHandler();
                requestPromise = _classPrivateMethodGet(this, _request, _request2).call(this, KsqldbClient.QUERY_STREAM_ENDPOINT, buffer, requestHandler);
                /**
                 * If the query has a bad query it will return successfuly. Then whoever pick the answer
                 * needs to validate the response.
                 */

                return _context2.abrupt("return", requestPromise);

              case 12:
                throw new Error("Client is not connected.");

              case 13:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function query(_x4, _x5) {
        return _query2.apply(this, arguments);
      }

      return query;
    }()
    /**
     * This method may be used to issue push queries.
     * @param {string} statement of query to execute
     * @param {Function} callback to push query data
     * @param {Object} optionalExtraParams like streamsProperties, sessionVariables or commandSequenceNumber
     */

  }, {
    key: "streamQuery",
    value: function () {
      var _streamQuery2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3(_streamQuery, callback, optionalExtraParams) {
        var body, buffer, requestHandler, requestPromise;
        return _regenerator["default"].wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                if (!(0, _classPrivateFieldGet4["default"])(this, _asyncConnection)) {
                  _context3.next = 12;
                  break;
                }

                _context3.next = 3;
                return (0, _classPrivateFieldGet4["default"])(this, _asyncConnection);

              case 3:
                /**
                 * Parser wrapper around callback to load metadata
                 */
                body = {};

                if (optionalExtraParams) {
                  body = _objectSpread({}, optionalExtraParams);
                }

                body = _objectSpread(_objectSpread({}, body), {}, {
                  sql: _streamQuery
                });
                buffer = Buffer.from(JSON.stringify(body));
                requestHandler = new StreamQueryHandler(callback);
                requestPromise = _classPrivateMethodGet(this, _request, _request2).call(this, KsqldbClient.QUERY_STREAM_ENDPOINT, buffer, requestHandler, "application/vnd.ksqlapi.delimited.v1");
                /**
                 * If the streamQuery has a bad query it will return successfuly. Then whoever pick the answer
                 * needs to validate the response.
                 */

                return _context3.abrupt("return", requestPromise);

              case 12:
                throw new Error("Client is not connected.");

              case 13:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function streamQuery(_x6, _x7, _x8) {
        return _streamQuery2.apply(this, arguments);
      }

      return streamQuery;
    }()
    /**
     * Inserts a row into a ksqlDB stream.
     *
     * @param streamName name of the target stream
     * @param row the rows to insert. Keys are column names and values are column values.
     *
     * @return a promise that completes once the server response is received
     */

  }, {
    key: "insertInto",
    value: function () {
      var _insertInto = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee4(streamName, row) {
        var body, buffer, requestHandler, requestPromise;
        return _regenerator["default"].wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                if (!(0, _classPrivateFieldGet4["default"])(this, _asyncConnection)) {
                  _context4.next = 10;
                  break;
                }

                _context4.next = 3;
                return (0, _classPrivateFieldGet4["default"])(this, _asyncConnection);

              case 3:
                body = {
                  target: streamName
                };
                buffer = Buffer.from(JSON.stringify(body)) + "\n" + JSON.stringify(row);
                requestHandler = new InsertStreamHandler();
                requestPromise = _classPrivateMethodGet(this, _request, _request2).call(this, KsqldbClient.INSERTS_ENDPOINT, buffer, requestHandler);
                /**
                 * If the query has a bad query it will return successfuly. Then whoever pick the answer
                 * needs to validate the response.
                 */

                return _context4.abrupt("return", requestPromise);

              case 10:
                throw new Error("Client is not connected.");

              case 11:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function insertInto(_x9, _x10) {
        return _insertInto.apply(this, arguments);
      }

      return insertInto;
    }()
    /**
     * Terminates a push query with the specified query ID.
     *
     * @param {*} queryId
     */

  }, {
    key: "terminatePushQuery",
    value: function () {
      var _terminatePushQuery = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee5(queryId) {
        var terminate;
        return _regenerator["default"].wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                _context5.next = 2;
                return this.executeStatement(undefined, {
                  queryId: queryId
                }, KsqldbClient.CLOSE_QUERY_ENDPOINT);

              case 2:
                terminate = _context5.sent;
                return _context5.abrupt("return", terminate);

              case 4:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function terminatePushQuery(_x11) {
        return _terminatePushQuery.apply(this, arguments);
      }

      return terminatePushQuery;
    }()
    /**
     * Returns the list of ksqlDB streams from the ksqlDB server's metastore.
     *
     * @return list of streams
     */

  }, {
    key: "listStreams",
    value: function () {
      var _listStreams = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee6() {
        var _yield$_classPrivateM, data, error, rows, _rows, streams;

        return _regenerator["default"].wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                _context6.next = 2;
                return _classPrivateMethodGet(this, _executeAdminStatement, _executeAdminStatement2).call(this, "LIST STREAMS;", KsqldbClient.KSQL_ENDPOINT);

              case 2:
                _yield$_classPrivateM = _context6.sent;
                data = _yield$_classPrivateM.data;
                error = _yield$_classPrivateM.error;

                if (!(!data || error)) {
                  _context6.next = 9;
                  break;
                }

                return _context6.abrupt("return", []);

              case 9:
                rows = data.rows;
                _rows = (0, _slicedToArray2["default"])(rows, 1), streams = _rows[0].streams;
                return _context6.abrupt("return", streams);

              case 12:
              case "end":
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function listStreams() {
        return _listStreams.apply(this, arguments);
      }

      return listStreams;
    }()
    /**
     * Returns the list of ksqlDB tables from the ksqlDB server's metastore
     *
     * @return list of tables
     */

  }, {
    key: "listTables",
    value: function () {
      var _listTables = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee7() {
        var _yield$_classPrivateM2, data, rows, _rows2, tables;

        return _regenerator["default"].wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                _context7.next = 2;
                return _classPrivateMethodGet(this, _executeAdminStatement, _executeAdminStatement2).call(this, "LIST TABLES;", KsqldbClient.KSQL_ENDPOINT);

              case 2:
                _yield$_classPrivateM2 = _context7.sent;
                data = _yield$_classPrivateM2.data;
                rows = data.rows;
                _rows2 = (0, _slicedToArray2["default"])(rows, 1), tables = _rows2[0].tables;
                return _context7.abrupt("return", tables);

              case 7:
              case "end":
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      function listTables() {
        return _listTables.apply(this, arguments);
      }

      return listTables;
    }()
    /**
     * Returns the list of Kafka topics available for use with ksqlDB.
     *
     * @return list of topics
     */

  }, {
    key: "listTopics",
    value: function () {
      var _listTopics = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee8() {
        var _yield$_classPrivateM3, data, rows, _rows3, topics;

        return _regenerator["default"].wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                _context8.next = 2;
                return _classPrivateMethodGet(this, _executeAdminStatement, _executeAdminStatement2).call(this, "LIST TOPICS;", KsqldbClient.KSQL_ENDPOINT);

              case 2:
                _yield$_classPrivateM3 = _context8.sent;
                data = _yield$_classPrivateM3.data;
                rows = data.rows;
                _rows3 = (0, _slicedToArray2["default"])(rows, 1), topics = _rows3[0].topics;
                return _context8.abrupt("return", topics);

              case 7:
              case "end":
                return _context8.stop();
            }
          }
        }, _callee8, this);
      }));

      function listTopics() {
        return _listTopics.apply(this, arguments);
      }

      return listTopics;
    }()
    /**
     * Returns the list of queries currently running on the ksqlDB server.
     *
     * @return list of queries
     */

  }, {
    key: "listQueries",
    value: function () {
      var _listQueries = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee9() {
        var _yield$_classPrivateM4, data, rows, _rows4, queries;

        return _regenerator["default"].wrap(function _callee9$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                _context9.next = 2;
                return _classPrivateMethodGet(this, _executeAdminStatement, _executeAdminStatement2).call(this, "LIST QUERIES;", KsqldbClient.KSQL_ENDPOINT);

              case 2:
                _yield$_classPrivateM4 = _context9.sent;
                data = _yield$_classPrivateM4.data;
                rows = data.rows;
                _rows4 = (0, _slicedToArray2["default"])(rows, 1), queries = _rows4[0].queries;
                return _context9.abrupt("return", queries);

              case 7:
              case "end":
                return _context9.stop();
            }
          }
        }, _callee9, this);
      }));

      function listQueries() {
        return _listQueries.apply(this, arguments);
      }

      return listQueries;
    }()
    /**
     * Returns metadata about the ksqlDB stream or table of the provided name.
     *
     * @param sourceName stream or table name
     * @return metadata for stream or table
     */

  }, {
    key: "describeSource",
    value: function () {
      var _describeSource = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee10(sourceName) {
        var _yield$_classPrivateM5, data, rows, _rows5, sourceDescription;

        return _regenerator["default"].wrap(function _callee10$(_context10) {
          while (1) {
            switch (_context10.prev = _context10.next) {
              case 0:
                _context10.next = 2;
                return _classPrivateMethodGet(this, _executeAdminStatement, _executeAdminStatement2).call(this, "DESCRIBE ".concat(sourceName, "; "), KsqldbClient.KSQL_ENDPOINT);

              case 2:
                _yield$_classPrivateM5 = _context10.sent;
                data = _yield$_classPrivateM5.data;
                rows = data.rows;
                _rows5 = (0, _slicedToArray2["default"])(rows, 1), sourceDescription = _rows5[0].sourceDescription;
                return _context10.abrupt("return", sourceDescription);

              case 7:
              case "end":
                return _context10.stop();
            }
          }
        }, _callee10, this);
      }));

      function describeSource(_x12) {
        return _describeSource.apply(this, arguments);
      }

      return describeSource;
    }()
  }]);
  return KsqldbClient;
}()), (0, _defineProperty2["default"])(_class, "QUERY_STREAM_ENDPOINT", "/query-stream"), (0, _defineProperty2["default"])(_class, "INSERTS_ENDPOINT", "/inserts-stream"), (0, _defineProperty2["default"])(_class, "CLOSE_QUERY_ENDPOINT", "/close-query"), (0, _defineProperty2["default"])(_class, "KSQL_ENDPOINT", "/ksql"), _temp);

function _buildHostUrl2(host) {
  if (host) {
    var parsedHost = !/^https?:\/\//i.test(host) ? "http://".concat(host) : host;
    return parsedHost;
  } else {
    return (0, _classPrivateFieldGet4["default"])(this, _DEFAULT_HOST);
  }
}

function _buildBasicAuth2() {
  var _classPrivateFieldGet3 = (0, _classPrivateFieldGet4["default"])(this, _options),
      authorization = _classPrivateFieldGet3.authorization;

  var username = authorization.username,
      password = authorization.password;

  try {
    var encoded = Buffer.from("".concat(username, ":").concat(password, " ")).toString("base64");
    /**
     * Username and password encoded in base64
     */

    return "Basic ".concat(encoded, " ");
  } catch (e) {
    console.error("Error building basic authorization.");
    throw e;
  }
}

function _request2(path, buffer, requestHandler, accept) {
  var reqConfig = {
    ":scheme": "http",
    ":method": "POST",
    ":path": path,
    Accept: accept || "application/json",
    "Content-Type": "application/json",
    "Content-Length": buffer.length
  };

  if (this.authorization && this.authorization.username && this.authorization.password) {
    var authToken = _classPrivateMethodGet(this, _buildBasicAuth, _buildBasicAuth2).call(this, this.authorization);

    reqConfig.Authorization = authToken;
  }
  /**
   * Write request
   */


  var request = (0, _classPrivateFieldGet4["default"])(this, _http2Session).request(reqConfig, {
    endStream: false
  });
  request.setEncoding("utf8");
  var handleRequestPromise = requestHandler.handleRequest(request);
  request.write(buffer);
  request.end();
  return handleRequestPromise;
}

function _executeAdminStatement2(_x13, _x14) {
  return _executeAdminStatement3.apply(this, arguments);
}

function _executeAdminStatement3() {
  _executeAdminStatement3 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee11(statement, path) {
    var body, requestHandler, buffer, requestPromise;
    return _regenerator["default"].wrap(function _callee11$(_context11) {
      while (1) {
        switch (_context11.prev = _context11.next) {
          case 0:
            if (!(0, _classPrivateFieldGet4["default"])(this, _asyncConnection)) {
              _context11.next = 10;
              break;
            }

            _context11.next = 3;
            return (0, _classPrivateFieldGet4["default"])(this, _asyncConnection);

          case 3:
            body = {
              ksql: statement
            };
            requestHandler = new AdminStatementHandler();
            /**
             * Build request buffer
             */

            buffer = Buffer.from(JSON.stringify(body));
            requestPromise = _classPrivateMethodGet(this, _request, _request2).call(this, path, buffer, requestHandler);
            /**
             * If the query has a bad query it will return successfuly. Then whoever pick the answer
             * needs to validate the response.
             */

            return _context11.abrupt("return", requestPromise);

          case 10:
            throw new Error("Client is not connected.");

          case 11:
          case "end":
            return _context11.stop();
        }
      }
    }, _callee11, this);
  }));
  return _executeAdminStatement3.apply(this, arguments);
}