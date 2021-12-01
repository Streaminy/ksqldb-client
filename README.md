# ksqldb-client

Simple KsqlDB client for Node.js using JavaScript 🚀

# Documentation

## Install

```bash
npm install ksqldb-client
```

## Getting started

```javascript
const KsqldbClient = require("ksqldb-client");
const client = new KsqldbClient();

const asyncOperation = async () => {
    await client.connect();
    const streams = await client.listStreams();
    console.log(streams);

    /* ... */

    await client.disconnect();
};

asyncOperation();
```

## Username authorization

```javascript
const options = {
    authorization: {
        username: "username",
        password: "password",
        ssl: {
            ca: ..,
            crt: ..,
            key: ..,
        }
    },
    host: "http://..",
    port: 8088,

}
const client = new KsqldbClient(options);
```

## Pull queries

```javascript
const { data, status, error } = await client.query("SELECT * FROM table WHERE column = 'string';");
const { metadata, rows } = data;
```

## Push queries

```javascript
const cb = (data) => {
    const { metadata, rows } = data;
    const { queryId } = metadata;
    // ...
};

// Promise resolves after the push query ends.
const { status, error } = await client.streamQuery("SELECT * FROM table EMIT CHANGES;", cb);
```

## Terminate push query

```javascript
const { error } = await client.terminatePushQuery("queryId");

if (!error) {
    console.log("Query terminated.");
}
```

## Execute statement

```javascript
await client.executeStatement("DROP TABLE IF EXISTS table;");
```

## Insert into

```javascript
const row = {
    field: "value",
};
const { status, error } = await client.insertInto("streamName", row);
const { metadata, rows } = data;
```

## Describe source

```javascript
const sourceDescription = await client.describeSource("streamName");
```

# Handling errors

There are two types of errors.

-   Error returned by KsqlDB after processing the request.
-   Error thrown while doing the request.

```javascript
try {
    const { status, error } = await client.query("SELECT *;");

    if (error) {
        console.log("Error returned by KsqlDB: ", error);
    }
} catch (err) {
    console.error("Error thrown while doing the query: ", err);
}
```

# Status

The status returned on each operation is the same one returned by KsqlDB (200, 400, 500, etc..) and they could be used to troubleshoot errors or assert successful requests.

# Stream properties and session variables

Optional extra parameters can be used as follow:

```javascript
// Statements
const executeStatementResults = await client.executeStatement(statement, {
    sessionVariables: {
        STREAM_NAME: STREAM_NAME,
        TOPIC_NAME: TOPIC_NAME,
    },
});

// Querys
const query = "SELECT * FROM ${TABLE_NAME} WHERE WORD in ('${FIRST_WORD}', '${SECOND_WORD}');";
const { data: queryData, error } = await client.query(query, {
    sessionVariables: {
        TABLE_NAME: TABLE_NAME,
        FIRST_WORD: "tree",
        SECOND_WORD: "wind",
    },
});

// Stream Query
const streamQueryResults = await client.streamQuery("SELECT * FROM ${TABLE_NAME} EMIT CHANGES;", cb, {
    sessionVariables: {
        TABLE_NAME: TABLE_NAME,
    },
});
```
