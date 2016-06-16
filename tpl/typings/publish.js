var fs = require('fs');
var rootNs = {
  depth: 0,
  namespaces: {},
  body: ''
};

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
  var classes = data({kind: "class"}).get();

  Object.keys(classes).forEach(function(k) {
    var cls = classes[k];

    var longname = cls.longname;
    //skipping classes like EntityManager.EntityManager
    if (longname && longname.indexOf(cls.name) == longname.length - cls.name.length) {

      var ns = getNamespaceOf(longname);
      var clsDef = createClass(data, cls, ns.depth);
      ns.body += clsDef;
    }
  });

  var text = 'export var DB: baqend.EntityManager;\n';
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
        var text = prefix + 'export namespace ' + ns.name + ' {\n';
        text += createNs(ns);
        text += prefix + '}\n';
        return text;
      })
      .join('');

  return body;
}

function createClass(data, cls, depth) {
  var lines = [];
  lines.push('class ' + cls.name + ' {');

  var members = data({memberof: cls.longname}).get() || [];
  var hiddenMembers = data({memberof: cls.longname + '.' + cls.name}).get() || [];
  members = [].concat(hiddenMembers, members);

  members.forEach(function(member) {
    /*if (member.comment) {
      member.comment.split(/(\\r)?\\n/).map(function(l) {
        lines.push('  ' + l);
      });
    }*/

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

        if (member.params) {
          member.params.forEach(function(param, index) {
            if (index > 0)
              line += ', ';

            line += param.name + ': ' + createType(param.type);
          });
        }

        line += '): ';
        if (member.returns) {
          line += createType(member.returns[0].type);
        } else {
          line += 'any';
        }

        line += ';';
        break;
      default:
        console.log('Not handled ' + member.kind + ' ' + member.name)
        return;
    }
    lines.push(line);
  });
  lines.push('}');

  var prefix = spaces(depth);
  return prefix + lines.join('\n' + prefix) + '\n';
}

function createType(typeSpec) {
  if (!typeSpec) {
    console.log(typeSpec)
    return 'unknown'
  } else {
    var type = typeSpec.names[0];
    type = type.replace(/function/g, 'Function');
    type = type.replace(/\*/g, 'any');
    return type.replace(/\.</g, '<');
  }
}

function spaces(depth) {
  var prefix = '';
  for (var i = 0; i < depth; ++i) {
    prefix += '  ';
  }
  return prefix;
}