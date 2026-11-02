import assert from 'node:assert/strict';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { isOwnExtension, toolLabel } from '../src/agent.ts';

const PACKAGE_DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

test('the agent session leaves out this extension and its files', () => {
  assert.equal(isOwnExtension(PACKAGE_DIR), true);
  assert.equal(isOwnExtension(path.join(PACKAGE_DIR, 'index.ts')), true);
});

test('the agent session keeps an extension whose folder only shares a name prefix', () => {
  assert.equal(isOwnExtension(`${PACKAGE_DIR}-other`), false);
  assert.equal(isOwnExtension(path.dirname(PACKAGE_DIR)), false);
});

test('the status shows the tool name with its command, path or pattern', () => {
  assert.equal(toolLabel('bash', { command: 'npm test' }), 'bash npm test');
  assert.equal(toolLabel('read', { path: 'src/a.ts' }), 'read src/a.ts');
  assert.equal(toolLabel('edit', { file_path: 'src/b.ts' }), 'edit src/b.ts');
  assert.equal(toolLabel('grep', { pattern: 'TODO' }), 'grep TODO');
});

test('the status shows only the tool name when the arguments have no detail', () => {
  assert.equal(toolLabel('ls', undefined), 'ls');
  assert.equal(toolLabel('ls', { limit: 3 }), 'ls');
});

test('the status shows only the first line of a long command, cut to 80 characters', () => {
  assert.equal(toolLabel('bash', { command: 'echo one\necho two' }), 'bash echo one');
  const label = toolLabel('bash', { command: 'x'.repeat(200) });
  assert.equal(label.length, 80);
  assert.equal(label, `bash ${'x'.repeat(74)}…`);
});
