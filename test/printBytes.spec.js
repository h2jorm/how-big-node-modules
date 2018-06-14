const printBytes = require('../src/printBytes');

test('printBytes', () => {
  expect(printBytes(1023)).toBe('1023 B');
  expect(printBytes(1024 * 10)).toBe('10 KB');
  expect(printBytes(1024 * 10 + 512)).toBe('10.50 KB');
  expect(printBytes(1024 * 1024 * 10)).toBe('10 MB');
  expect(printBytes(1024 * 1024 * 1024 * 10)).toBe('10 GB');
});
