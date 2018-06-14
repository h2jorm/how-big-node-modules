const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];
const UNIT = 1024;

module.exports = function printBytes(bytes) {
  let i, n;
  let left = 0;
  for (i = 0, n = bytes; n > UNIT && i < BYTE_UNITS.length; ++i) {
    left += (n % UNIT) * Math.pow(UNIT, i);
    n = parseInt(n / UNIT);
  }
  const print = left ? (n + left / Math.pow(UNIT, i)).toFixed(2) : n;
  return print + ' ' + BYTE_UNITS[i];
};
