/* eslint-disable no-param-reassign,@typescript-eslint/no-unused-expressions,@typescript-eslint/no-unused-vars,no-shadow,max-len */

import {
  db, query, model, metamodel,
} from 'baqend';

db.connect('test', true).then(() => {
  // db.Test.load('test').then((entity) => {
  //
  // });
});

db.User.load('id').then((user) => {
  user!.newPassword('alodPassword', 'newPassword');
  user!.customUserProp = 'test';
});

db.User.find()
  .equal('age', 3)
  .between('age', 2, 20)
  .equal('name', 'Test QueryPerson')
  .in('vals', 3)
  .containsAny('vals', [3, 4, 5])
  .singleResult((user) => {
    user!.username;
  });

db.code.loadCode('foo', 'module', true)
  .then((code) => {
    code.name;
    code.call('test', 'world');
  });

db.code.loadCode('foo', 'module', false)
  .then((code) => {
    code.includes('stuff');
  });

db.code.loadCode('foo', 'module')
  .then((code) => {
    code.includes('stuff');
  });

const builder:query.Builder<model.Role> = db.Role.find();

const q1 = builder.notIn('age', [3, 4, 5])
  .in('places', 2, 3, 4)
  .gt('ref', db.User.me!);

const q2 = builder.equal('name', 'test')
  .notEqual('street', 'Mainroad');

builder.or(q1, q2)
  .singleResult((role) => {
    role!.addUser(db.User.me!);
  });

db.Test.load('test').then((entity) => {
  entity!.myProp = 'test';
  const { headers } = entity!.file;
  headers.test = 'new header';
});

db.Hallo.find().singleResult().then(() => {

});

db.User.login('test', 'pw').then((user) => {

});

const user = new db.User();

db.log.trace('A message');
db.log.debug('A message');
db.log.info('A message');
db.log.warn('A message');
db.log.error('A message');
db.log.info('A message with data', { some: 'data' });
db.log.info('A message with placeholders %d %s', 1, 'string', { some: 'data' });

const file = new db.File('test');
file.upload({ force: true });
file.loadMetadata().then((file) => { /* ... */ });
file.loadMetadata({ refresh: true }).then((file) => { /* ... */ });

db.modules.get('test', 'test=bla');
db.modules.get('test', { test: 'bla' }, { responseType: 'json' });
db.modules.post('test', { test: 'bla' }, { responseType: 'json' });

new metamodel.EmbeddableType('Type');
