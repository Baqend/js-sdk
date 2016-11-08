/// <reference path="./types.d.ts" />

import {binding, query, model, baqend} from '../streaming';
import {db} from '../streaming';

db.connect('test', true).then(() => {
    //db.Test.load('test').then((entity) => {
    //
    //});
});

let stream:Observable<model.Test> = db.Test.find()
    .stream();

stream.subscribe(test => {
    test.myProp;
});

