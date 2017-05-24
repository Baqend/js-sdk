"use strict";
const fs = require('fs');
const account = require('./account');
const request = require('request');
const path = require('path');

const filepath = './baqend/schema/';

module.exports = function(args) {
  return account.login({app: args.app, host: args.host}).then((db) => {
    if (!fs.existsSync(filepath)){
      createDir(filepath)
    }
    switch(args.command) {
      case 'upload':
        uploadSchema(db, args).then(() => {
          console.log("---------------------------------------")
          console.log("The schema was successfully " + (args.force && "replaced" || "updated") )
        }, (err) => {
          console.log("An error occured")
        })
        break;
      case 'download':
        downloadSchema(db, args).then(() => {
          console.log("---------------------------------------")
          console.log("Your schema was successfully downloaded")
        }, (err) => {
          console.log("schema.json could not be saved. Did you create a baqend directory already?")
        })
        break;
    }
  })
}

function uploadSchema(db, args = {}) {
  let allSchemas = []
  let filepath = 'baqend/schema/'
  return readDirectory(filepath).then((fileNames) => {
    return Promise.all(
      fileNames.map((fileName) => {
        return readFile(path.join(filepath, fileName)).then((file) => {
          return JSON.parse(file)
        })
      })
    ).then((schemas) => {
      schemas.forEach((schema) => {
        console.log("Uploading " + schema.class.replace('/db/', '') + " Schema")
      })
      if (args.force) {
        return db.send(new db.message.ReplaceAllSchemas(schemas))
      } else {
        return db.send(new db.message.UpdateAllSchemas(schemas))
      }
    })
  })
}

function downloadSchema(db, args = {}) {
  return db.send(new db.message.GetAllSchemas()).then((res) => {
    return Promise.all(
      res.entity.map((schema) => {
        let classname = schema.class.replace('/db/', '')
        let filename = 'baqend/schema/' + classname + ".json"

        if (!classname.match(/logs\./) && classname !== 'Object') {
          return writeFile(filename, JSON.stringify(schema, null, 2)).then(() => {
            console.log('Downloaded ' + classname + ' Schema')
          })
        }
      })
    )
  });
}

function readDirectory(filePath) {
  return new Promise((resolve, reject) => {
    fs.readdir(filePath, (err, fileNames) => {
      err ? reject(err) : resolve(fileNames);
    })
  })
}

function writeFile(filePath, data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, data, (err, fileNames) => {
      err ? reject(err) : resolve(fileNames);
    })
  })
}

function readFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf-8', (err, file) => {
      err ? reject(err) : resolve(file);
    })
  });
}

// recursive directory creation
function createDir(dir) {
  const splitPath = dir.split('/');
  splitPath.reduce((path, subPath) => {
    let currentPath;
    if(subPath != '.'){
      currentPath = path + '/' + subPath;
      if (!fs.existsSync(currentPath)){
        fs.mkdirSync(currentPath);
      }
    }
    else{
      currentPath = subPath;
    }
    return currentPath
  }, '')
}
