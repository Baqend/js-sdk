"use strict";
const fs = require('fs');
const account = require('./account');
const request = require('request');
const path = require('path');

const filepath = './baqend/schema/';

module.exports = function(args) {
  return account.login({app: args.app, host: args.host}).then((db) => {
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
  }).catch(e => console.error(e.message ||e));
}

function uploadSchema(db, args = {}) {
  let allSchemas = []
  let filepath = 'baqend/schema/'
  return new Promise((success, error) => {
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
      }).then((res) => {
        success(res)
      }, (err) => {
        error(err)
      })
    })
  })
}

function downloadSchema(db, args = {}) {
  return new Promise((success, error) => {
    db.send(new db.message.GetAllSchemas()).then((res) => {
      Promise.all(
        res.entity.map((schema) => {
          let classname = schema.class.replace('/db/', '')
          let filename = 'baqend/schema/' + classname + ".json"

          if (!classname.match(/logs\./) && classname !== 'Object') {
            return new Promise(function (resolve, reject) {
              fs.writeFile(filename, JSON.stringify(schema, null, 2), function(err) {
                if (err) {
                  reject(err);
                } else {
                  console.log('Downloaded ' + classname + ' Schema')
                  resolve();
                }
              });
            })
          }

        })
      ).then(() => {
        success(true)
      }, (err) => {
        error(err)
      })
    }, (err) => {
      console.log(err)
    });
  });
}

function readDirectory(filePath) {
  return new Promise((resolve, reject) => {
    fs.readdir(filePath, (err, fileNames) => {
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
