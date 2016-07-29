"use strict";

const fs = require('fs');
const os = require('os');

const rootNs = {
  longname: '',
  prefix: '',
  namespaces: {},
  imports: [],
  body: []
};

const typeDefs = {};
const push = Function.prototype.apply.bind(Array.prototype.push);

function getNamespaceOf(longname) {
  let nsIndex = longname.lastIndexOf(".");

  if (nsIndex == -1) {
    return rootNs;
  }

  let ns = longname.substring(0, nsIndex);
  let name = ns.substring(ns.lastIndexOf('.') + 1, nsIndex);

  let parentNamespace = getNamespaceOf(ns);

  let namespace = parentNamespace.namespaces[name];
  if (!namespace) {
    namespace = parentNamespace.namespaces[name] = {
      name: name,
      longname: (parentNamespace.lognname? parentNamespace + '.': '') + name,
      prefix: parentNamespace.prefix + '  ',
      namespaces: {},
      imports: [],
      body: []
    };
  }

  return namespace;
}

/**
 @param {TAFFY} taffyData See <http://taffydb.com/>.
 @param {object} opts
 @param {Tutorial} tutorials
 */
exports.publish = function(data, opts, tutorials) {
  let types = data({kind: "typedef"}).get();
  Object.keys(types).forEach(function(k) {
    let type = types[k];
    typeDefs[type.longname] = '(' + createParams(type) + ') => ' + createReturn(type);
  });

  let classes = data({kind: ["class","interface"]}).get();
  Object.keys(classes).forEach(function(k) {
    let cls = classes[k];

    let longname = cls.longname;
    //skipping classes like EntityManager.EntityManager
    if (!cls.ignore && longname && longname.indexOf(cls.name) == longname.length - cls.name.length) {
      let ns = getNamespaceOf(longname);
      let lines = createClass(data, cls, ns);

      ns.body.push('');
      push(ns.body, lines);
    }
  });

  let enums = data({isEnum: true}).get();
  Object.keys(enums).forEach(function(k) {
    let enu = enums[k];

    let longname = enu.longname;
    //skipping classes like EntityManager.EntityManager
    if (!enu.ignore && longname && longname.indexOf(enu.name) == longname.length - enu.name.length) {
      let ns = getNamespaceOf(longname);

      let lines = createEnum(enu, ns);
      if (ns.body.length) {
        ns.body.push('');
      }

      push(ns.body, lines);
    }
  });
  
  let text = fs.readFileSync(__dirname + '/head.d.tpl');
  text += createNs(data, rootNs).join(os.EOL);

  fs.writeFileSync('index.d.ts', text);
  fs.writeFileSync('doc.json', JSON.stringify(data().get(), null, '  '));

  return null;
};

function createNs(data, namespace) {
  let lines = [];
  let prefix = namespace.prefix;

  if (namespace.imports.length) {
    push(lines, namespace.imports.map((imp => namespace.prefix + imp)));
  }

  push(lines, namespace.body);

  Object.keys(namespace.namespaces).forEach((k) => {
    let ns = namespace.namespaces[k];

    lines.push('');
    if (ns.name) {
      lines.push(prefix + 'export namespace ' + ns.name + ' {');
    }

    let isClassNameSpace = data({kind: ["class","interface"], longname: ns.longname}).get().length;
    if (!isClassNameSpace) {
      push(lines, createMembers(data, ns.prefix, ns.longname, true));
    }

    push(lines, createNs(data, ns));

    if (ns.name) {
      lines.push(prefix + '}');
    }
  });

  return lines;
}

function createClass(data, cls, ns) {
  let classLine = ns.prefix + 'export ';
  let isInterface = cls.kind == 'interface' || cls.longname.startsWith('binding') && cls.longname.indexOf('Factory') != -1;
  if (isInterface) {
    classLine += 'interface ' + cls.name;
  } else {
    classLine += 'class ' + cls.name;
  }

  if (cls.augments || cls.implements) {
    if (isInterface) {
      classLine += ' extends ';
      classLine += [].concat(
        (cls.augments || []).map(augment => importCls(ns, cls, augment)),
        (cls.implements || []).map(iface => importCls(ns, cls, iface))
      ).join(', ');
    } else {
      if (cls.augments) {
        classLine += ' extends ' + importCls(ns, cls, cls.augments[0]);
      }

      if (cls.implements) {
        classLine += ' implements ' + cls.implements.map(iface => importCls(ns, cls, iface)).join(', ');
      }
    }
  }

  classLine += ' {';

  let lines = [classLine];

  if (!isInterface) {
    lines.push(ns.prefix + '  constructor(' + createParams(cls) + ')');
  }

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

function importCls(ns, cls, parent) {
  let generics = '';
  let genericIndex = parent.indexOf('<');
  if (genericIndex != -1) {
    generics = parent.substring(genericIndex);
    parent = parent.substring(0, genericIndex);
  }

  let extd = parent;
  let parentNameSpace = getNamespaceOf(parent);

  extd = extd.substring(extd.lastIndexOf('.') + 1); // split out namespace
  if (parentNameSpace != ns && !cls.longname.startsWith(parentNameSpace.longname)) {
    let importLine = 'import ' + extd + ' = ' + parent + ';';
    if (ns.imports.indexOf(importLine) == -1)
      ns.imports.push(importLine);
  }

  return extd + generics;
}

function createMembers(data, prefix, fullClassName, exportIt) {
  let name = fullClassName.substring(fullClassName.lastIndexOf('.') + 1);

  let lines = [];
  let members = data({memberof: fullClassName}).get() || [];
  let hiddenMembers = data({memberof: fullClassName + '.' + name}).get() || [];
  members = [].concat(hiddenMembers, members);

  members.forEach(function(member) {
    if (member.inherited || member.ignore || member.isEnum || member.access == 'private' || member.undocumented)
      return;

    let line = prefix + '  ';
    if (member.scope == 'static')
      line += 'static ';

    switch (member.kind) {
      case 'member':
        if (!member.type) //skip setter
          return;

        if (exportIt)
          line += 'export let ';

        line += member.name + ': ' + createType(member.type) + ';';
        break;
      case 'function':
        if (exportIt)
          line += 'export function ';

        line += '' + member.name + '(';
        line += createParams(member);
        line += '): ' + createReturn(member) + ';';
        break;
      default:
        return;
    }
    lines.push(line);
  });

  return lines;
}

function createEnum(enu, ns) {
  let lines = [];
  lines.push(`${ns.prefix}export enum ${enu.name} {`);

  for (let i = 0, len = enu.properties.length; i < len; ++i) {
    let prop = enu.properties[i];
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

  let params = {};

  member.params.forEach(function(param, index) {
    let names = param.name.split('.');
    let name = names[0];

    let type = createType(param.type);
    if (names.length > 1) {
      let obj = params[name];
      if (typeof obj != "object") {
        obj = params[name] = {};
      }

      obj[names[1]] = {type: type, optional: param.optional};
    } else {
      params[name] = type;
    }
  });

  return member.params.filter((param) => {
    return params[param.name];
  }).map((param) => {
    let paramSpec = params[param.name];
    let p = '';
    if (param.variable) {
      p += '...';
    }
    p += param.name;
    if (param.optional) {
      p += '?';
    }
    p += ': ';

    if (param.variable) {
      p += 'Array<';
    }

    if (typeof paramSpec == "string") {
      p += paramSpec;
    } else {
      p += '{' + Object.keys(paramSpec).map(key => {
        let subParam = paramSpec[key];
        return key + (subParam.optional? '?': '') + ': ' + subParam.type;
      }).join(', ') + '}';
    }

    if (param.variable) {
      p += '>';
    }

    return p;
  }).join(', ');
}

function createReturn(member) {
  if (member.returns) {
    return createType(member.returns[0].type);
  } else {
    return 'any';
  }
}

function createType(typeSpec) {
  if (!typeSpec) {
    console.log(typeSpec)
    return 'unknown'
  } else {
    return typeSpec.names.map((name) => {
      let type = typeDefs[name];
      if (!type) {
        type = name;
        type = type.replace(/function/g, 'Function');
        type = type.replace(/Function\(\)/g, 'Function');
        type = type.replace(/\*/g, 'any');
        type = type.replace(/\.</g, '<');
      }
      
      if (type.startsWith('Object<')) {
        type = '([' + type.substring('Object<'.length, type.length - 1) + '])';
      }
      
      return type;
    }).join('|');
  }
}