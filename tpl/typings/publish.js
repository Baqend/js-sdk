var fs = require('fs');
var rootNs = {
  depth: 0,
  namespaces: {},
  imports: [],
  body: ''
};

var typeDefs = {};

function getNamespaceOf(longname) {
  var ns = longname.substring(0, longname.lastIndexOf("."));

  var parentNamespace;
  if (ns.indexOf(".") != -1) {
    parentNamespace = getNamespaceOf(ns);
  } else {
    parentNamespace = rootNs;
  }

  var name = ns.substring(ns.lastIndexOf('.') + 1);
  var namespace = parentNamespace.namespaces[name];
  if (!namespace) {
    namespace = parentNamespace.namespaces[name] = {
      name: name,
      depth: parentNamespace.depth + 1,
      namespaces: {},
      imports: [],
      body: ''
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
  var types = data({kind: "typedef"}).get();
  Object.keys(types).forEach(function(k) {
    var type = types[k];
    typeDefs[type.longname] = '(' + createParams(type) + ') => ' + createReturn(type);
  });

  var classes = data({kind: "class"}).get();
  Object.keys(classes).forEach(function(k) {
    var cls = classes[k];

    var longname = cls.longname;
    //skipping classes like EntityManager.EntityManager
    if (!cls.ignore && longname && longname.indexOf(cls.name) == longname.length - cls.name.length) {
      var ns = getNamespaceOf(longname);
      createClass(data, cls, ns);
    }
  });

  var enums = data({isEnum: true}).get();
  Object.keys(enums).forEach(function(k) {
    var enu = enums[k];

    var longname = enu.longname;
    //skipping classes like EntityManager.EntityManager
    if (!enu.ignore && longname && longname.indexOf(enu.name) == longname.length - enu.name.length) {
      var ns = getNamespaceOf(longname);
      createEnum(enu, ns);
    }
  });
  
  var text = fs.readFileSync(__dirname + '/head.d.ts');
  text += createNs(rootNs);

  fs.writeFileSync('typings.d.ts', text);
  fs.writeFileSync('doc.json', JSON.stringify(data().get(), null, '  '));

  return null;
}

function createNs(namespace) {

  var body = namespace.body;

  body += Object.keys(namespace.namespaces)
      .map(function(k) {
        var ns = namespace.namespaces[k];
        var prefix = spaces(namespace.depth);
        var nsDef = namespace.depth == 0? 'declare': 'export';
        var text = prefix + nsDef + ' namespace ' + ns.name + ' {\n';

        if (ns.imports.length) {
          text += prefix + '  ' + ns.imports.join('\n' + prefix + '  ') + '\n';
        }

        text += createNs(ns);
        text += prefix + '}\n\n';
        return text;
      })
      .join('');

  return body;
}

function createClass(data, cls, ns) {
  var lines = [];

  var classLine = 'export class ' + cls.name;
  if (cls.augments) {
    classLine += ' extends ';

    classLine += cls.augments.map((augment) => {
      var extd = augment;

      var index = extd.lastIndexOf('.');
      if (index != -1) {
        var otherNs = extd.substring(0, index);
        extd = extd.substring(index + 1);
        if (cls.longname.indexOf(otherNs) != 0 || cls.longname.indexOf('.', index + 1) != -1) {
          var importLine = 'import ' + extd + ' = ' + augment + ';';
          if (ns.imports.indexOf(importLine) == -1)
            ns.imports.push(importLine);
        }
      }

      return extd;
    }).join(', ');
  }

  classLine += ' {';

  lines.push(classLine);

  var members = data({memberof: cls.longname}).get() || [];
  var hiddenMembers = data({memberof: cls.longname + '.' + cls.name}).get() || [];
  members = [].concat(hiddenMembers, members);

  members.forEach(function(member) {
    if (member.inherited || member.ignore || member.isEnum || member.access == 'private' || member.undocumented)
      return;

    var line = '  ';
    if (member.scope == 'static')
      line += 'static ';

    switch (member.kind) {
      case 'member':
        if (!member.type) //skip setter
          return;

        line += member.name + ': ' + createType(member.type) + ';';
        break;
      case 'function':
        line += '' + member.name + '(';
        line += createParams(member);
        line += '): ' + createReturn(member) + ';';
        break;
      default:
        console.log('Not handled ' + member.kind + ' ' + member.name)
        return;
    }
    lines.push(line);
  });
  lines.push('}');

  var prefix = spaces(ns.depth);
  var classBody = (lines.length == 2? lines.join(''): lines.join('\n' + prefix)) + '\n';

  ns.body += prefix + classBody;
}

function createEnum(enu, ns) {
  var prefix = spaces(ns.depth);
  var enumBody = prefix + 'export enum ' + enu.name + ' {\n';

  enumBody += prefix + enu.properties.map((prop) => {
    return '  ' + prop.name + ' = ' + prop.defaultvalue;
  }).join(',\n' + prefix) + '\n';

  enumBody += prefix + '}\n';

  ns.body += enumBody;
}

function createParams(member) {
  if (!member.params)
    return '';

  var params = {};

  member.params.forEach(function(param, index) {
    var names = param.name.split('.');
    var name = names[0];

    var type = createType(param.type);
    if (names.length > 1) {
      var obj = params[name];
      if (typeof obj != "object") {
        obj = params[name] = {};
      }

      obj[names[1]] = type;
    } else {
      params[name] = type;
    }
  });

  return member.params.filter((param) => {
    return params[param.name];
  }).map((param) => {
    var paramSpec = params[param.name];
    var p = '';
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
        return key + ': ' + paramSpec[key];
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
      var type = typeDefs[name];
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

function spaces(depth) {
  var prefix = '';
  for (var i = 0; i < depth; ++i) {
    prefix += '  ';
  }
  return prefix;
}