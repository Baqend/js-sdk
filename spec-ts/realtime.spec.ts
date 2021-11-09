/* eslint-disable @typescript-eslint/no-unused-expressions,@typescript-eslint/no-unused-vars */
/// <reference path="./types.d.ts" />

import { Observable, Subscription } from 'rxjs';
import {
  query, model, db,
} from 'baqend';

db.connect('test', true).then(() => {
  // db.Test.load('test').then((entity) => {
  //
  // });
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

const stream:Observable<query.RealtimeEvent<model.Test>> = db.Test.find()
  .equal('myProp', 'test')
  .eventStream({ matchTypes: 'all' });

const subscription:Subscription = stream.subscribe();

subscription.unsubscribe();

db.Test.find()
  .equal('myProp', 'test')
  .resultStream((result:Array<model.Test>) => {
    const prop:string = result[0].myProp;
  });

stream.subscribe((event) => {
  const question = event.data;

  if (event.matchType === 'add' || event.initial) {
    // add something
  } else if (event.matchType === 'remove') {
    // remove something
  }

  question.myProp;
});
