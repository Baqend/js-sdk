/** @typedef {{ names: string[] }} TypeSpecification */
/** @typedef {{ name: string, longname: string, prefix: string, namespaces: Object<string, Namespace>, body: string[] }} Namespace */

const fs = require('fs');
const os = require('os');

/** @type {Namespace} */
const rootNs = {
  name: '',
  longname: '',
  prefix: '',
  namespaces: {},
  body: [],
};

const typeDefs = {};
const push = Function.prototype.apply.bind(Array.prototype.push);

/**
 * @param {string} longname
 * @return {Namespace}
 */
function getNamespaceOf(longname) {
  const nsIndex = longname.lastIndexOf('.');

  if (nsIndex == -1) {
    return rootNs;
  }

  const ns = longname.substring(0, nsIndex);
  const name = ns.substring(ns.lastIndexOf('.') + 1, nsIndex);

  const parentNamespace = getNamespaceOf(ns);

  const namespace = parentNamespace.namespaces[name];
  if (namespace) {
    return namespace;
  }

  return parentNamespace.namespaces[name] = {
    name: name,
    longname: (parentNamespace.lognname ? parentNamespace + '.' : '') + name,
    prefix: parentNamespace.prefix + '  ',
    namespaces: {},
    body: [],
  };
}

/**
 @param {TAFFY} data See <http://taffydb.com/>.
 @param {object} opts
 @param {Tutorial} tutorials
 */
function publish(data, opts, tutorials) {
  // Process all callback definitions
  let types = data({ kind: 'typedef' }).get();
  Object.keys(types).forEach(function (k) {
    let type = types[k];
    typeDefs[type.longname] = '(' + createParams(type) + ') => ' + createReturn(type);
  });

  // Process all classes and interfaces
  const classes = data({ kind: ['class', 'interface'] }).get();
  for (const cls of classes) {
    const { longname } = cls;
    //skipping classes like EntityManager.EntityManager
    if (!cls.ignore && !cls.undocumented && longname && longname.indexOf(cls.name) == longname.length - cls.name.length) {
      const ns = getNamespaceOf(longname);
      let lines = createClass(data, cls, ns);

      ns.body.push('');
      push(ns.body, lines);
    }
  }

  // Process all enumerations
  const enums = data({ isEnum: true }).get();
  for (const enumeration of enums) {
    const { longname } = enumeration;
    //skipping classes like EntityManager.EntityManager
    if (!enumeration.ignore && longname && longname.indexOf(enumeration.name) == longname.length - enumeration.name.length) {
      const ns = getNamespaceOf(longname);

      let lines = createEnum(enumeration, ns);
      if (ns.body.length) {
        ns.body.push('');
      }

      push(ns.body, lines);
    }
  }

  // Load template for file header
  let text = fs.readFileSync(__dirname + '/' + opts.destination.replace('.ts', '.tpl'));

  text += createNs(data, rootNs).join(os.EOL);

  fs.writeFileSync(opts.destination, text);
  //fs.writeFileSync('doc.json', JSON.stringify(data().get(), null, '  '));

  return null;
}

/**
 * @param {*} data
 * @param {Namespace} namespace
 * @return {string[]}
 */
function createNs(data, namespace) {
  const lines = [];
  const prefix = namespace.prefix;

  push(lines, namespace.body);

  for (const ns of Object.values(namespace.namespaces)) {
    lines.push('');
    if (ns.name) {
      lines.push(prefix + 'export namespace ' + ns.name + ' {');
    }

    const isClassNameSpace = data({ kind: ['class', 'interface'], longname: ns.longname }).get().length;
    if (!isClassNameSpace) {
      push(lines, createMembers(data, ns.prefix, ns.longname, true));
    }

    push(lines, createNs(data, ns));

    if (ns.name) {
      lines.push(prefix + '}');
    }
  }

  return lines;
}

/**
 * @param {*} data
 * @param {*} cls
 * @param {Namespace} ns
 * @return {string[]}
 */
function createClass(data, cls, ns) {
  const lines = [];
  const isInterface = cls.kind == 'interface' || cls.longname.startsWith('binding') && cls.longname.indexOf('Factory') != -1;

  // Print out class description
  const description = cls.classdesc || cls.description;
  if (description) {
    lines.push(`${ns.prefix}/**`);
    for (const descriptionLine of description.split('\n')) {
      lines.push(`${ns.prefix} * ${descriptionLine}`);
    }
    lines.push(`${ns.prefix} */`);
  }

  // Create class declaration
  let classLine = ns.prefix + 'export ';
  if (isInterface) {
    classLine += 'interface ' + cls.name;
  } else {
    classLine += 'class ' + cls.name;
  }

  if (cls.augments || cls.implements) {
    if (isInterface) {
      classLine += ' extends ';
      classLine += [].concat(
        (cls.augments || []),
        (cls.implements || []),
      ).join(', ');
    } else {
      if (cls.augments) {
        classLine += ' extends ' + cls.augments[0];
      }

      if (cls.implements) {
        classLine += ' implements ' + cls.implements.join(', ');
      }
    }
  }

  classLine += ' {';
  lines.push(classLine);

  // Create constructor
  if (!isInterface) {
    lines.push(ns.prefix + '  constructor(' + createParams(cls) + ');');
  }

  // Create class members
  push(lines, createMembers(data, ns.prefix, cls.longname));
  if (!isInterface && cls.augments && cls.augments.length > 1) {
    for (let i = 1, len = cls.augments.length; i < len; ++i) {
      push(lines, createMembers(data, ns.prefix, cls.augments[i]));
    }
  }

  if (lines.length == 1)
    return [classLine + '}'];

  lines.push(ns.prefix + '}');
  return lines;
}

function createMembers(data, prefix, fullClassName, exportIt) {
  const name = fullClassName.substring(fullClassName.lastIndexOf('.') + 1);

  const lines = [];
  const members = data({ memberof: fullClassName }).get() || [];
  const hiddenMembers = data({ memberof: fullClassName + '.' + name }).get() || [];

  const allMembers = [].concat(hiddenMembers, members);

  for (const member of allMembers) {
    if (member.inherited || member.ignore || member.isEnum || member.access == 'private' || member.undocumented) {
      continue;
    }

    switch (member.kind) {
      case 'member': {
        let line = prefix + '  ';
        if (member.scope == 'static') {
          line += 'static ';
        }

        if (!member.type) //skip setter
          continue;

        if (exportIt) {
          line += 'export const ';
        } else if (member.readonly) {
          line += 'readonly ';
        }

        line += member.name
        if (member.nullable) {
          line += '?'
        }

        line += ': ' + createType(member.type) + ';';
        lines.push(line);

        break;
      }
      case 'function': {
        let line = prefix;
        if (exportIt) {
          lines.push('');
          if (member.description) {
            lines.push(`${prefix}/**`);
            lines.push(`${prefix} * ${member.description}`);
            lines.push(`${prefix} */`);
          }
          // Exported function
          line += 'export function ';
        } else {
          // Method
          line += '  ';
          if (member.scope == 'static') {
            line += 'static ';
          }
        }

        line += member.name;
        line += '(';
        line += createParams(member);
        line += '): ' + createReturn(member) + ';';
        lines.push(line);

        break;
      }
      default:
        continue;
    }

  }

  return lines;
}

/**
 * @param {*} enumeration
 * @param {Namespace} ns
 * @return {string[]}
 */
function createEnum(enumeration, ns) {
  const lines = [];
  lines.push(`${ns.prefix}export enum ${enumeration.name} {`);

  for (let i = 0, len = enumeration.properties.length; i < len; ++i) {
    const prop = enumeration.properties[i];
    let line = `${ns.prefix}  ${prop.name} = ${prop.defaultvalue}`;
    if (i < len - 1)
      line += ',';
    lines.push(line);
  }

  lines.push(ns.prefix + '}');
  return lines;
}

function createParams(member) {
  if (!member.params)
    return '';

  const params = {};

  member.params.forEach((param) => {
    const names = param.name.split('.');
    const name = names[0];

    const type = createType(param.type);
    if (names.length > 1) {
      let obj = params[name];
      if (typeof obj != 'object') {
        obj = params[name] = {};
      }

      obj[names[1]] = { type: type, optional: param.optional };
    } else {
      params[name] = type;
    }
  });

  return member.params.filter((param) => {
    return params[param.name];
  }).map((param) => {
    const paramSpec = params[param.name];
    let p = '';
    if (param.variable) {
      p += '...';
    }
    p += param.name;
    if (param.optional) {
      p += '?';
    }
    p += ': ';

    if (typeof paramSpec == 'string') {
      p += paramSpec;
    } else {
      p += '{ ' + Object.keys(paramSpec).map(key => {
        const subParam = paramSpec[key];
        return key + (subParam.optional ? '?' : '') + ': ' + subParam.type;
      }).join(', ') + ' }';
    }

    if (param.variable) {
      p += '[]';
    }

    return p;
  }).join(', ');
}

/**
 * @param {*} member
 * @return {string}
 */
function createReturn(member) {
  if (member.returns) {
    return createType(member.returns[0].type);
  }

  console.warn('No return type for ' + member.longname)
  return 'any';
}

/**
 * @param {string} name
 * @return {string}
 */
function createSingleType(name) {
  let type = typeDefs[name];
  if (!type) {
    type = name;

    type = type.replace(/function/g, 'Function');
    type = type.replace(/Function\(\)/g, 'Function');
    type = type.replace(/\*/g, 'any');
    type = type.replace(/\.</g, '<');

    type = type.replace(/Object\.?<([^,]+),\s*([^>]+)>/g, '{ [key: $1]: $2 }');
    type = type.replace(/^Array<(.*)>$/, '$1[]');

    typeDefs[name] = type;
  }

  return type;
}

/**
 * @param {TypeSpecification} typeSpec
 * @return {string}
 */
function createType(typeSpec) {
  if (!typeSpec) {
    console.warn('Unknown type spec occured.');
    return 'unknown';
  }

  if (typeSpec.names.length > 1) {
    return `(${typeSpec.names.map((name) => createSingleType(name)).join(' | ')})`;
  }

  return createSingleType(typeSpec.names[0]);
}

exports.publish = publish;
