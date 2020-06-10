'use strict';

import { EntityManagerFactory } from "./EntityManagerFactory";
import { WebSocketConnector } from "./connector";
import { EntityManager } from "../lib";
import { Stream } from "./query/Stream";
import { Node } from "./query/Node";
import { Observable } from "rxjs";

export { WebSocketConnector } from "./connector";
export { Stream } from "./query/Stream";
export { Node } from "./query/Node";
export { Observable } from "rxjs";

const proto = EntityManager.prototype as any;
Object.assign(proto, {
    EntityManagerFactory,
    Observable,
});

Object.assign(proto.connector, {
    WebSocketConnector,
});

Object.assign(proto.query, {
    Node,
    Stream,
});

export * from "../lib/baqend";
