/// <reference path="./types.d.ts" />

import {binding, query, model, baqend} from '../streaming';
import {db} from '../streaming';
import {Observable} from 'rxjs/Observable';

db.connect('test', true).then(() => {
    //db.Test.load('test').then((entity) => {
    //
    //});
});

db.User.find()
    .equal('age', 3)
    .between('age', 2, 20)
    .equal('name', 'Test QueryPerson')
    .in('vals', 3)
    .containsAny('vals', [3,4,5])
    .singleResult((user) => {
        user.username;
    });

let stream:Observable<model.Test> = db.Test.find()
    .stream();

stream.subscribe(test => {
    test.myProp;
});

