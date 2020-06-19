'use strict';

import { WebSocketConnector } from "./connector";
import { Stream } from "./query/Stream";
import { Observable } from "rxjs";
import db from '../lib/index.commonjs';

const baqend = db as any;
Object.assign(baqend, {
    Observable,
});

Object.assign(baqend.connector, {
    WebSocketConnector,
});

Object.assign(baqend.query, {
    Stream,
});

// @ts-ignore
export = db;
