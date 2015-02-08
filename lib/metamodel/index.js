var Metamodel = require('./Metamodel');

exports = module.exports = new Metamodel();

exports.Attribute = require('./Attribute');
exports.BasicType = require('./BasicType');
exports.CollectionAttribute = require('./CollectionAttribute');
exports.EmbeddableType = require('./EmbeddableType');
exports.EntityType = require('./EntityType');
exports.ListAttribute = require('./ListAttribute');
exports.ManagedType = require('./ManagedType');
exports.MapAttribute = require('./MapAttribute');
exports.Metamodel = require('./Metamodel');
exports.ModelBuilder = require('./ModelBuilder');
exports.PluralAttribute = require('./PluralAttribute');
exports.SetAttribute = require('./SetAttribute');
exports.SingularAttribute = require('./SingularAttribute');
exports.Type = require('./Type');
exports.DbIndex = require('./DbIndex');
