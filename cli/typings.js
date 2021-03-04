const os = require('os');
const fs = require('fs');
const baqend = require('..');

const { CollectionType } = baqend.metamodel.PluralAttribute;

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
  JsonObject: '{}',
  File: 'binding.File',
  NativeQuery: 'NativeQuery',
};

const nativeTypes = ['User', 'Role', 'Device'];
const push = Function.prototype.apply.bind(Array.prototype.push);

module.exports = function (args) {
  if (!args.app) {
    return false;
  }
  return createTypings(args.app, args.dest);
};

function createTypings(app, dest) {
  const factory = new baqend.EntityManagerFactory({ host: app });

  return factory.ready().then(() => {
    const typings = typingsFromMetamodel(factory.metamodel);

    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest);
    }

    fs.writeFileSync(`${dest}/baqend-model.d.ts`, typings.join(os.EOL));
    console.log(`Typings successfully saved to: ${dest}/baqend-model.d.ts`);
  });
}

function typingsFromMetamodel(metamodel) {
  const typings = [];
  const namespaces = {};
  // import all native types, so they can be easily used in definitions
  typings.push('import {binding, GeoPoint} from "baqend";');
  typings.push('');

  const module = [];
  module.push('declare module "baqend" {');
  module.push('');
  module.push('  interface baqend {');

  const model = [];
  model.push('  namespace model {');

  for (const key of Object.keys(metamodel.entities)) {
    const entity = metamodel.entities[key];

    if (entity.name === 'Object') continue;

    const isNative = nativeTypes.indexOf(entity.name) != -1;
    // register only user defined types
    if (!isNative) {
      if (entity.name.indexOf('.') !== -1) {
        const [namespace, entityName] = entity.name.split('.');
        module.push(`    ["${entity.name}"]: binding.EntityFactory<model.${entity.name}>;`);
        entity.name = entityName;
        if (!namespaces[namespace]) namespaces[namespace] = [];
        push(namespaces[namespace], typingsFromSchema(entity, 'Entity'));
      } else {
        module.push(`    ${entity.name}: binding.EntityFactory<model.${entity.name}>;`);
        push(model, typingsFromSchema(entity, 'Entity'));
      }
    }
    model.push('');
  }

  for (const key of Object.keys(metamodel.embeddables)) {
    const embeddable = metamodel.embeddables[key];

    if (embeddable.name.indexOf('.') !== -1) continue;

    module.push(`    ${embeddable.name}: binding.ManagedFactory<model.${embeddable.name}>;`);

    push(model, typingsFromSchema(embeddable, 'Managed'));
    model.push('');
  }

  module.push('  }');
  module.push('');
  for (const key in namespaces) {
    model.push(`  namespace ${key} {`);
    push(model, namespaces[key]);
    model.push('  }');
  }
  model.push('  }');

  push(module, model);
  module.push('}');

  push(typings, module);

  return typings;
}

function typingsFromSchema(entity, type) {
  const typings = [];

  typings.push(`    interface ${entity.name} extends binding.${type} {`);

  for (const attribute of entity.declaredAttributes) {
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

  typings.push('    }');
  return typings;
}

function typingsFromType(type) {
  if (type.isBasic) {
    return tsTypeMapping[type.name];
  }
  return type.name;
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
* */
