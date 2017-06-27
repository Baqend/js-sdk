/**
 * @namespace metamodel
 */
const Metamodel = require('./Metamodel');

Metamodel.prototype.Attribute = require('./Attribute');
Metamodel.prototype.BasicType = require('./BasicType');
Metamodel.prototype.CollectionAttribute = require('./CollectionAttribute');
Metamodel.prototype.EmbeddableType = require('./EmbeddableType');
Metamodel.prototype.EntityType = require('./EntityType');
Metamodel.prototype.ListAttribute = require('./ListAttribute');
Metamodel.prototype.ManagedType = require('./ManagedType');
Metamodel.prototype.MapAttribute = require('./MapAttribute');
Metamodel.prototype.Metamodel = require('./Metamodel');
Metamodel.prototype.ModelBuilder = require('./ModelBuilder');
Metamodel.prototype.PluralAttribute = require('./PluralAttribute');
Metamodel.prototype.SetAttribute = require('./SetAttribute');
Metamodel.prototype.SingularAttribute = require('./SingularAttribute');
Metamodel.prototype.Type = require('./Type');
Metamodel.prototype.DbIndex = require('./DbIndex');

exports = module.exports = new Metamodel();
