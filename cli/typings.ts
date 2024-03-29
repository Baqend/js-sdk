/* eslint-disable no-continue */
import os from 'os';
import { EntityManagerFactory, metamodel as meta } from 'baqend';
import {
  ensureDir, isNativeClassNamespace, writeFile,
} from './helper';

const { CollectionType } = meta.PluralAttribute;

const tsTypeMapping: { [type: string]: string } = {
  Boolean: 'boolean',
  Double: 'number',
  Integer: 'number',
  String: 'string',
  DateTime: 'Date',
  Time: 'Date',
  Date: 'Date',
  GeoPoint: 'GeoPoint',
  JsonArray: 'unknown[]',
  JsonObject: 'Record<string, unknown>',
  File: 'binding.File',
};

const nativeTypeExtends: Record<string, string> = {
  User: 'binding.User',
  Role: 'binding.Role',
};

const nativeFactoryies: Record<string, string> = {
  User: 'binding.UserFactory',
  Role: 'binding.EntityFactory<model.Role>',
  Device: 'binding.DeviceFactory',
};

const push = Function.prototype.apply.bind(Array.prototype.push);

export type TypingArgs = {
  app: string,
  dest: string,
};

export function typings(args: TypingArgs) : Promise<any> {
  if (!args.app) {
    return Promise.reject(new Error('Please specify the app parameter.'));
  }
  return createTypings(args.app, args.dest);
}

function createTypings(app: string, dest: string) {
  const factory = new EntityManagerFactory({ host: app });

  return factory.ready().then(() => {
    const types = typingsFromMetamodel(factory.metamodel);

    return ensureDir(dest)
      .then(() => writeFile(`${dest}/baqend-model.d.ts`, types.join(os.EOL)))
      .then(() => console.log(`Typings successfully saved to: ${dest}/baqend-model.d.ts`));
  });
}

function typingsFromMetamodel(metamodel: meta.Metamodel) {
  const typing: string[] = [];
  const namespaces: { [namespace: string]: string[] } = {};
  // import all native types, so they can be easily used in definitions
  typing.push('import {binding, GeoPoint} from "baqend";');
  typing.push('');

  const module: string[] = [];
  module.push('declare module "baqend" {');
  module.push('');
  module.push('  interface baqend {');

  const model: string[] = [];
  model.push('  namespace model {');

  for (const key of Object.keys(metamodel.entities)) {
    const entity = metamodel.entities[key];

    if (entity.name === 'Object') {
      continue;
    }

    if (isNativeClassNamespace(entity.name)) {
      continue;
    }

    // register only user defined types
    if (entity.name.indexOf('.') !== -1) {
      const [namespace, entityName] = entity.name.split('.');
      module.push(`    ["${entity.name}"]: binding.EntityFactory<model.${entity.name}> & { new(init?: Partial<model.${entity.name}>): model.${entity.name} };`);
      if (!namespaces[namespace]) namespaces[namespace] = [];
      push(namespaces[namespace], typingsFromSchema(entityName, entity, 'binding.Entity'));
    } else {
      const factoryString = nativeFactoryies[entity.name] || `binding.EntityFactory<model.${entity.name}>`;
      module.push(`    ${entity.name}: ${factoryString} & { new(init?: Partial<model.${entity.name}>): model.${entity.name} };`);
      push(model, typingsFromSchema(entity.name, entity, nativeTypeExtends[entity.name] || 'binding.Entity'));
    }

    model.push('');
  }

  for (const key of Object.keys(metamodel.embeddables)) {
    const embeddable = metamodel.embeddables[key];

    if (embeddable.name.indexOf('.') !== -1) continue;

    module.push(`    ${embeddable.name}: binding.ManagedFactory<model.${embeddable.name}> & { new(init?: Partial<model.${embeddable.name}>): model.${embeddable.name} };`);

    push(model, typingsFromSchema(embeddable.name, embeddable, 'binding.Managed'));
    model.push('');
  }

  module.push('  }');
  module.push('');
  for (const key of Object.keys(namespaces)) {
    model.push(`  namespace ${key} {`);
    push(model, namespaces[key]);
    model.push('  }');
  }
  model.push('  }');

  push(module, model);
  module.push('}');

  push(typing, module);

  return typing;
}

function typingsFromSchema(typeName: string, entity: meta.EntityType<any> | meta.EmbeddableType<any>, type: string) {
  const typing: string[] = [];

  typing.push(`    interface ${typeName} extends ${type} {`);

  for (const attribute of entity.declaredAttributes) {
    if (!attribute.isMetadata) {
      if (attribute.isCollection) {
        switch ((attribute as meta.PluralAttribute<any, any>).collectionType) {
          case CollectionType.LIST:
            typing.push(`      ${attribute.name}: Array<${typingsFromType((attribute as meta.ListAttribute<any>).elementType)}> | null;`);
            break;
          case CollectionType.MAP: {
            const mapAttr = attribute as meta.MapAttribute<any, any>;
            typing.push(`      ${attribute.name}: Map<${typingsFromType(mapAttr.keyType)}, ${typingsFromType(mapAttr.elementType)}> | null;`);
            break;
          }
          case CollectionType.SET:
            typing.push(`      ${attribute.name}: Set<${typingsFromType((attribute as meta.SetAttribute<any>).elementType)}> | null;`);
            break;
          default:
            break;
        }
      } else {
        typing.push(`      ${attribute.name}: ${typingsFromType((attribute as meta.SingularAttribute<any>).type)} | null;`);
      }
    }
  }

  typing.push('    }');
  return typing;
}

function typingsFromType(type: meta.Type<any>): string {
  if (type.isBasic) {
    return tsTypeMapping[type.name];
  }
  return type.name.split('.').pop()!;
}

/**
 import {binding} from "baqend";

 declare module "baqend" {

  interface baqend {
    Campaign:binding.EntityFactory<Campaign> & { new(init?: Partial<model.Campaign>): model.Campaign };
    Profile:binding.EntityFactory<Profile> & { new(init?: Partial<model.Profile>): model.Profile };
  }

  export interface Campaign extends binding.Entity {

  }

  export interface Profile extends binding.Entity {

  }

}
* */
