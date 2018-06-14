#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

const dfsNodeModules = require('./src/dfsNodeModules');
const printBytes = require('./src/printBytes');

const [, , dir = '.', topN = 10] = process.argv;

class Printer {
  constructor(stdout = process.stdout, stderr = process.stderr) {
    this.stdout = stdout;
    this.stderr = stderr;
  }

  write(str) {
    if (str) {
      this.stdout.write(str);
    }
  }

  writeLine(str) {
    if (str) {
      this.stdout.write(str);
    }
    this.stdout.write('\n');
  }

  clearLine() {
    this.stdout.clearLine();
    this.stdout.cursorTo(0);
  }
}

class Record {
  constructor() {
    this.map = {};
    this.freq = {};
    this.total = 0;
  }

  add(filepath, stat) {
    this.total += stat.size;
    const fragments = filepath.split('/');
    const idx = fragments.lastIndexOf('node_modules');
    if (idx !== -1) {
      let moduleName = fragments[idx + 1];
      if (moduleName.startsWith('.')) {
        return;
      }
      if (moduleName.startsWith('@')) {
        moduleName += `/${fragments[idx + 2]}`;
      }
      const key = fragments
        .slice(0, idx + 1)
        .concat(moduleName)
        .join('/');
      if (!this.map[key]) {
        this.freq[moduleName] = (this.freq[moduleName] || 0) + 1;
        this.map[key] = 1;
      }
    }
  }

  top(n) {
    return Object.entries(this.freq)
      .sort((a, b) => {
        return b[1] - a[1];
      })
      .slice(0, n);
  }

  totalSize() {
    return this.total;
  }
}

class Spiner {
  constructor(printer) {
    this.MAX_DOT_NUM = 10;
    this.printer = printer;
    this.interval = null;
    this.num = 0;
  }

  start() {
    if (this.interval) {
      return;
    }
    this.interval = setInterval(() => {
      if (this.num > this.MAX_DOT_NUM) {
        this.num = 0;
      } else {
        ++this.num;
      }
      this.draw();
    }, 200);
  }

  draw() {
    let str = 'Calculating ';
    let n = this.num;
    while (n) {
      str += '.';
      --n;
    }
    this.printer.clearLine();
    this.printer.write(str);
  }

  stop() {
    clearInterval(this.interval);
    this.interval = null;
  }
}

const record = new Record();
const printer = new Printer();
const spiner = new Spiner(printer);

function blanks(n) {
  return new Array(n).fill(' ').join('');
}

spiner.start();
dfsNodeModules(path.resolve(dir), (filepath, stat) => {
  record.add(filepath, stat);
}).then(() => {
  spiner.stop();
  printer.clearLine();
  printer.writeLine(`Total: ${printBytes(record.totalSize())}`);
  printer.writeLine();
  printer.writeLine(`-- Top ${topN} --`);
  printer.writeLine();
  const toPrint = record.top(topN);

  const maxLen = toPrint.reduce((max, [k]) => Math.max(max, k.length), 0);

  toPrint.forEach(([key, value], index) => {
    printer.writeLine(
      `${index + 1}\t${key}${blanks(maxLen + 4 - key.length)}${value}`
    );
  });
});
