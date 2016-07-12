/// <reference path="types.d.ts" />

import {binding, query, model} from '../lib/baqend';
import db from '../lib/baqend';
import "./types.d.ts";

db.connect('test', true).then(() => {
    //db.Test.load('test').then((entity) => {
    //
    //});
});

db.User.load('id').then((user) => {
    user.newPassword("alodPassword", "newPassword");
    user.customUserProp = "test";
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

let builder:query.Builder<model.Role> = db.Role.find();

let q1 = builder.notIn('age', [3,4,5])
    .in('places', 2, 3, 4);

let q2 = builder.equal('name', 'test')
    .notEqual('street', 'Mainroad');

builder.or(q1, q2)
    .singleResult((role) => {
       role.addUser(db.User.me);
    });

db.Test.load('test').then((entity) => {
    entity.myProp = 'test';
});

let Hallo:binding.EntityFactory<binding.Entity> = db["Hallo"];

Hallo.find().singleResult().then(() => {
    
});

db.User.login("test", "pw").then((user) => {

});

var user = new db.User();

