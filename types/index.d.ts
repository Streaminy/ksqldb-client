import { ClientSessionOptions, SecureClientSessionOptions } from "http2";

export interface ClientOptionsAuthorizationSsl {
    ca: string;
    cert: string;
    key: string;
}

export interface ClientOptionsAuthorization {
    ssl?: ClientOptionsAuthorizationSsl;
    username?: string;
    password?: string;
}

export interface ClientOptions {
    authorization?: ClientOptionsAuthorization;
    host?: string;
    port?: string | number;
    alpnProtocol?: string;
    timeout?: number;
    sessionOptions?: ClientSessionOptions | SecureClientSessionOptions;
}

export interface OptionalExtraParams {
    streamsProperties?: Record<string, string>;
    sessionVariables?: Record<string, string>;
    commandSequenceNumber?: number;
}

export interface Metadata {
    columnNames: Array<string>;
    columnTypes: Array<string>;
    queryId?: string;
}

export interface Data {
    metadata: Metadata;
    rows?: Array<unknown>;
}

export interface Response {
    error?: Error;
    status: number;
    data?: Data;
}

type TBD = Response;

export interface Stream {
    isWindowed: boolean;
    keyFormat: string;
    name: string;
    topic: string;
    type: string;
    valueFormat: string;
}

export interface Table {
    isWindowed: boolean;
    keyFormat: string;
    name: string;
    topic: string;
    type: string;
    valueFormat: string;
}

export interface Query {
    id: string;
    queryString: string;
    queryType: string;
    sinkKafkaTopics: Array<string>;
    sinks: Array<string>;
    state: string;
    statusCount: Record<string, number>;
}

export interface Topic {
    name: string;
    replicaInfo: Array<number>;
}

export interface PushQueryResponse extends Response {
    data: undefined;
}

export interface InsertResponseDataRow {
    seq: number;
    status: string;
}

export interface InsertResponseData extends Data {
    rows: Array<InsertResponseDataRow>;
    metadata: undefined;
}
export interface InsertResponse extends Response {
    data: InsertResponseData;
}

/**
 * There are additional fields that needs to be validated:
 * schema: {
 *  fields: TBD
 *  memberSchema: TBD
 * }
 */
export interface FieldInfo {
    name: string;
    schema: {
        type: string;
        fields: TBD;
        memberSchema: TBD;
    };
}

/**
 * There are additional fields that needs to be validated:
 * replication: number;
 * queryOffsetSummaries: Array<?>;
 * partitions: number;
 * clusterErrorStats: Array<?>;
 * clusterStatistics: Array<?>;
 */
export interface SourceDescription {
    name: string;
    type: string;
    fields: Array<FieldInfo>;
    topic: string;
    keyFormat: string;
    valueFormat: string;
    statement: string;
    sourceConstraints: Array<string>;
    timestamp?: string;
    windowType?: string;
    extended?: boolean;
    errorStats?: string;
    readQueries?: Array<Query>;
    writeQueries?: Array<Query>;
}

export default class KsqldbClient {
    constructor(options?: ClientOptions);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    executeStatement(statement: string, optionalExtraParams?: OptionalExtraParams, path?: string): Promise<Response>;
    query(query: string, optionalExtraParams?: OptionalExtraParams): Promise<Response>;
    streamQuery(
        streamQuery: string,
        callback: (callbackData: Data) => void,
        optionalExtraParams?: OptionalExtraParams
    ): Promise<Response>;
    insertInto(streamName: string, row: Record<string, any>): Promise<InsertResponse>;
    terminatePushQuery(queryId: string): Promise<PushQueryResponse>;
    listStreams(): Promise<Array<Stream>>;
    listTables(): Promise<Array<Table>>;
    listTopics(): Promise<Array<Topic>>;
    listQueries(): Promise<Array<Query>>;
    describeSource(sourceName: string): Promise<SourceDescription>;
}

export as namespace KsqldbClient;
