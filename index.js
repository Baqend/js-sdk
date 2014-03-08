var tags = document.getElementsByTagName('script');
var tag = tags[tags.length - 1];

var path = tag.getAttribute('src');
path = path.substring(0, path.lastIndexOf('/') + 1);

var index = [
  "src/package.js",
  "src/jspa/Collections.js",
  "src/jspa/Deferred.js",
  "src/jspa/util/QueueConnector.js",
  "src/jspa/EntityManager.js",
  "src/jspa/EntityManagerFactory.js",
  "src/jspa/EntityTransaction.js",
  "src/jspa/PersistenceUnitUtil.js",
  "src/jspa/Query.js",
  "src/jspa/binding/Accessor.js",
  "src/jspa/binding/ClassUtil.js",
  "src/jspa/collection/Collection.js",
  "src/jspa/collection/List.js",
  "src/jspa/collection/Map.js",
  "src/jspa/collection/Set.js",
  "src/jspa/connector/Connector.js",
  "src/jspa/connector/NodeConnector.js",
  "src/jspa/connector/XMLHttpConnector.js",
  "src/jspa/error/PersistentError.js",
  "src/jspa/error/CommunicationError.js",
  "src/jspa/error/EntityExistsError.js",
  "src/jspa/error/EntityNotFoundError.js",
  "src/jspa/error/IllegalEntityError.js",
  "src/jspa/error/RollbackError.js",
  "src/jspa/message/Message.js",
  "src/jspa/message/DeleteObject.js",
  "src/jspa/message/GetAllOids.js",
  "src/jspa/message/GetAllSchemas.js",
  "src/jspa/message/GetBucketQuery.js",
  "src/jspa/message/GetObject.js",
  "src/jspa/message/PostAllSchemas.js",
  "src/jspa/message/PostObject.js",
  "src/jspa/message/PostTransaction.js",
  "src/jspa/message/PutObject.js",
  "src/jspa/message/PutTransactionAborted.js",
  "src/jspa/message/PutTransactionCommited.js",
  "src/jspa/metamodel/Attribute.js",
  "src/jspa/metamodel/Type.js",
  "src/jspa/metamodel/BasicType.js",
  "src/jspa/metamodel/PluralAttribute.js",
  "src/jspa/metamodel/CollectionAttribute.js",
  "src/jspa/metamodel/ManagedType.js",
  "src/jspa/metamodel/EmbeddableType.js",
  "src/jspa/metamodel/EntityType.js",
  "src/jspa/metamodel/ListAttribute.js",
  "src/jspa/metamodel/MapAttribute.js",
  "src/jspa/metamodel/Metamodel.js",
  "src/jspa/metamodel/ModelBuilder.js",
  "src/jspa/metamodel/SetAttribute.js",
  "src/jspa/metamodel/SingularAttribute.js",
  "src/jspa/util/Queue.js",
  "src/jspa/util/State.js",
  "src/package.js",
  "src/package.js"
];

for (var i = 0; i < index.length; ++i) {
    var script = document.createElement('script');
    script.setAttribute('type', 'text/javascript');
    script.setAttribute('src', path + index[i]);
    tag.parentNode.insertBefore(script, tag);
}