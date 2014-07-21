module.exports = {
  DeleteObject: require('./DeleteObject').DeleteObject,
  GetAllOids: require('./GetAllOids').GetAllOids,
  GetAllSchemas: require('./GetAllSchemas').GetAllSchemas,
  GetBucketQuery: require('./GetBucketQuery').GetBucketQuery,
  GetObject: require('./GetObject').GetObject,
  Message: require('./Message').Message,
  PostAllSchemas: require('./PostAllSchemas').PostAllSchemas,
  PostObject: require('./PostObject').PostObject,
  PostTransaction: require('./PostTransaction').PostTransaction,
  PutObject: require('./PutObject').PutObject,
  PutTransactionAborted: require('./PutTransactionAborted').PutTransactionAborted,
  PutTransactionCommitted: require('./PutTransactionCommitted').PutTransactionCommitted
};