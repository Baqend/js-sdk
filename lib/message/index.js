module.exports = {
  DeleteObject: require('./DeleteObject').DeleteObject,
  GetAllOids: require('./GetAllOids').GetAllOids,
  GetDbSchema: require('./GetDbSchema').GetDbSchema,
  GetBucketQuery: require('./GetBucketQuery').GetBucketQuery,
  GetObject: require('./GetObject').GetObject,
  Message: require('./Message').Message,
  PutDbSchema: require('./PutDbSchema').PutDbSchema,
  PutDbSchemaBucket: require('./PutDbSchemaBucket').PutDbSchemaBucket,
  PostObject: require('./PostObject').PostObject,
  PostTransaction: require('./PostTransaction').PostTransaction,
  PutObject: require('./PutObject').PutObject,
  PutTransactionAborted: require('./PutTransactionAborted').PutTransactionAborted,
  PutTransactionCommitted: require('./PutTransactionCommitted').PutTransactionCommitted
};