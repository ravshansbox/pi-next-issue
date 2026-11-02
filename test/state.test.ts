import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { test } from 'node:test';
import { lock, savedIssues, unlock } from '../src/state.ts';

function root(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'pi-next-issue-state-'));
}

test('a second run cannot take the lock while a live run holds it', async () => {
  const repo = root();
  await lock(repo);
  await assert.rejects(lock(repo), /another run works on this repository \(pid \d+\)/);
  await unlock(repo);
  await lock(repo);
  await unlock(repo);
});

test('a run takes over the lock of a run that is no longer alive', async () => {
  const repo = root();
  fs.mkdirSync(path.join(repo, '.worktrees'));
  fs.writeFileSync(path.join(repo, '.worktrees', 'run.lock'), '99999999\n');
  await lock(repo);
  const pid = fs.readFileSync(path.join(repo, '.worktrees', 'run.lock'), 'utf8').trim();
  assert.equal(pid, String(process.pid));
  await unlock(repo);
});

test('the lock file is not taken for a saved issue', async () => {
  const repo = root();
  await lock(repo);
  assert.deepEqual(await savedIssues(repo), []);
  await unlock(repo);
});

test('a run that ends leaves alone a lock that another run holds', async () => {
  const repo = root();
  fs.mkdirSync(path.join(repo, '.worktrees'));
  fs.writeFileSync(path.join(repo, '.worktrees', 'run.lock'), '99999999\n');
  await unlock(repo);
  assert.equal(fs.readFileSync(path.join(repo, '.worktrees', 'run.lock'), 'utf8'), '99999999\n');
});

test('a run that takes over a dead lock leaves no stale file behind', async () => {
  const repo = root();
  fs.mkdirSync(path.join(repo, '.worktrees'));
  fs.writeFileSync(path.join(repo, '.worktrees', 'run.lock'), '99999999\n');
  await lock(repo);
  assert.deepEqual(fs.readdirSync(path.join(repo, '.worktrees')), ['run.lock']);
  await unlock(repo);
  assert.deepEqual(fs.readdirSync(path.join(repo, '.worktrees')), []);
});

test('a second run that finds the lock held leaves no file of its own behind', async () => {
  const repo = root();
  await lock(repo);
  await assert.rejects(lock(repo), /another run works on this repository/);
  assert.deepEqual(fs.readdirSync(path.join(repo, '.worktrees')), ['run.lock']);
  await unlock(repo);
});
