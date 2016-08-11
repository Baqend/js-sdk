"use strict";
const os = require('os');
const fs = require('fs');
const baqend = require('../lib/baqend');
const CollectionType = require('../lib/metamodel/PluralAttribute').CollectionType;

const tsTypeMapping = {
  Boolean: 'boolean',
  Double: 'number',
  Integer: 'number',
  String: 'string',
  DateTime: 'Date',
  Time: 'Date',
  Date: 'Date',
  GeoPoint: 'GeoPoint',
  JsonArray: '[]',
  JsonObject: '{}'
};

const nativeTypes = ['User', 'Role', 'Device'];
const push = Function.prototype.apply.bind(Array.prototype.push);

module.exports = function(args) {
  if (!args.app) {
    return false;
  } else {
    createTypings(args.app, args.dest);
    return true;
  }
};

function createTypings(app, dest) {
  const factory = new baqend.EntityManagerFactory({host: app});

  factory.ready().then(() => {
    let typings = typingsFromMetamodel(factory.metamodel);
    dest = dest || 'typings';

    if (!fs.existsSync(dest)){
      fs.mkdirSync(dest);
    }

    fs.writeFileSync(dest + '/baqend-model.d.ts', typings.join(os.EOL));
  }).catch((e) => {
    console.error(e.stack)
  });
}

function typingsFromMetamodel(metamodel) {
  let typings = [];
  //import all native types, so they can be easily used in definitions
  typings.push(`import {binding, GeoPoint} from "baqend";`);
  typings.push('');

  let module = [];
  module.push('declare module "baqend" {');
  module.push('');
  module.push('  interface baqend {');

  let model = [];
  model.push('  namespace model {');

  for (let key of Object.keys(metamodel.entities)) {
    let entity = metamodel.entities[key];

    if (entity.name.startsWith('logs.') || entity.name == 'Object')
      continue;

    let isNative = nativeTypes.indexOf(entity.name) != -1;
    //register only user defined types
    if (!isNative)
      module.push(`    ${entity.name}: binding.EntityFactory<model.${entity.name}>;`);

    push(model, typingsFromSchema(entity, 'Entity'));
    model.push('');
  }

  for (let key of Object.keys(metamodel.embeddables)) {
    let embeddable = metamodel.embeddables[key];

    module.push(`    ${embeddable.name}: binding.ManagedFactory<model.${embeddable.name}>;`)

    push(model, typingsFromSchema(embeddable, 'Managed'));
    model.push('');
  }

  module.push('  }');
  module.push('');

  model.push('  }');

  push(module, model);
  module.push('}');

  push(typings, module);

  return typings;
}

function typingsFromSchema(entity, type) {
  let typings = [];

  typings.push(`    interface ${entity.name} extends binding.${type} {`);

  for (let attribute of entity.declaredAttributes) {
    if (!attribute.isMetadata) {
      if (attribute.isCollection) {
        switch (attribute.collectionType) {
          case CollectionType.LIST:
            typings.push(`      ${attribute.name}: Array<${typingsFromType(attribute.elementType)}>;`);
            break;
          case CollectionType.MAP:
            typings.push(`      ${attribute.name}: Map<${typingsFromType(attribute.keyType)}, ${typingsFromType(attribute.elementType)}>;`);
            break;
          case CollectionType.SET:
            typings.push(`      ${attribute.name}: Set<${typingsFromType(attribute.elementType)}>;`);
            break;
        }
      } else {
        typings.push(`      ${attribute.name}: ${typingsFromType(attribute.type)};`);
      }
    }
  }

  typings.push(`    }`);
  return typings;
}

function typingsFromType(type) {
  if (type.isBasic) {
    return tsTypeMapping[type.name];
  } else {
    return type.name;
  }
}

/**
 import {binding} from "baqend";

 declare module "baqend" {

  interface baqend {
    Campaign:binding.EntityFactory<Campaign>;
    Profile:binding.EntityFactory<Profile>;
  }

  export interface Campaign extends binding.Entity {

  }

  export interface Profile extends binding.Entity {

  }

}
**/