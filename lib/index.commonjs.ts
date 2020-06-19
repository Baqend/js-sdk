'use strict';

import * as binding from "./binding";
import * as connector from "./connector";
import * as error from "./error";
import * as message from "./message";
import * as util from "./util";
import * as caching from "./caching";
import * as query from "./query";
import * as partialupdate from "./partialupdate";
import * as intersection from "./intersection";
import * as metamodel from "./metamodel";

import { Permission, Metadata, TokenStorage, Validator } from "./intersection";

import { EntityManagerFactory } from "./EntityManagerFactory";
import { EntityManager} from "./EntityManager";
import { Acl } from "./Acl";

import { db } from "./baqend";

['Permission', 'Metadata', 'TokenStorage', 'Validator', 'PushMessage', 'Code', 'Modules', 'Logger'].forEach(type => {
    Object.defineProperty(util, type, {
        get(): any {
            console.log(`Usage of util.${type} is deprecated, use intersection.${type} instead.`);
            return intersection[type];
        }
    });
});

Object.assign(db, {
    db,
    binding,
    connector,
    error,
    message,
    util,
    caching,
    query,
    partialupdate,
    intersection,

    EntityManagerFactory,
    EntityManager,
    Acl,
});

Object.assign(db.metamodel, metamodel);

// @ts-ignore
export = db;

