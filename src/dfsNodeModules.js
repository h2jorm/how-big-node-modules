const fs = require('fs');
const path = require('path');

function noop() {}

function createPromiseFsHandler(method) {
  return function(file) {
    return new Promise((resolve, reject) => {
      fs[method](file, (err, stat) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(stat);
      });
    });
  };
}

const NODE_MODULES_REGEX = /\/node_modules$/;

const stat = createPromiseFsHandler('stat');
const readdir = createPromiseFsHandler('readdir');

async function walk(dir, cb, isNodeModules) {
  const files = await readdir(dir);
  for (let i = 0; i < files.length; i++) {
    const p = path.join(dir, files[i]);
    const s = await stat(p);
    if (s.isDirectory()) {
      await walk(p, cb, isNodeModules || NODE_MODULES_REGEX.test(p));
    } else if (s.isFile()) {
      if (isNodeModules) {
        cb(p, s);
      }
    }
  }
}

module.exports = function(dir, cb = noop) {
  return walk(dir, cb, NODE_MODULES_REGEX.test(dir));
};
