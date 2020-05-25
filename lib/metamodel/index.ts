'use strict';

import { Metamodel } from "./Metamodel";
import { DbIndex } from "./DbIndex";
import { Type } from "./Type";
import { SingularAttribute } from "./SingularAttribute";
import { SetAttribute } from "./SetAttribute";
import { PluralAttribute } from "./PluralAttribute";
import { ModelBuilder } from "./ModelBuilder";
import { MapAttribute } from "./MapAttribute";
import { ManagedType } from "./ManagedType";
import { ListAttribute } from "./ListAttribute";
import { EntityType } from "./EntityType";
import { EmbeddableType } from "./EmbeddableType";
import { CollectionAttribute } from "./CollectionAttribute";
import { BasicType } from "./BasicType";
import { Attribute } from "./Attribute";

// export all classes on the metamodel instance as well
Object.assign(Metamodel.prototype, {
    DbIndex,
    Type,
    SingularAttribute,
    SetAttribute,
    PluralAttribute,
    ModelBuilder,
    MapAttribute,
    ManagedType,
    ListAttribute,
    EntityType,
    EmbeddableType,
    CollectionAttribute,
    BasicType,
    Attribute,
});

export {
    DbIndex,
    Type,
    SingularAttribute,
    SetAttribute,
    PluralAttribute,
    ModelBuilder,
    MapAttribute,
    ManagedType,
    ListAttribute,
    EntityType,
    EmbeddableType,
    CollectionAttribute,
    BasicType,
    Attribute,
}
