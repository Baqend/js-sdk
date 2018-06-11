const readline = require('readline');

function readInput(question, hidden) {
  let Writable = require('stream').Writable;

  let mutableStdout = new Writable({
    write: function(chunk, encoding, callback) {
      if (!this.muted) {
        process.stdout.write(chunk, encoding);
      }
      callback();
    }
  });

  let rl = readline.createInterface({
    input: process.stdin,
    output: mutableStdout,
    terminal: true
  });

  return new Promise((resolve, reject) => {
    mutableStdout.muted = false;
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
    rl.on('SIGINT', () => {
      rl.close();
      reject(new Error('Input is aborted.'))
    });
    mutableStdout.muted = hidden;
  });
}

exports.readInput = readInput;