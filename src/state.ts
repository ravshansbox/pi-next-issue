import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { WORKTREE_DIR } from './git.ts';
import type { IssueState } from './runner.ts';

function dir(root: string): string {
  return join(root, WORKTREE_DIR);
}

function file(root: string, issue: number): string {
  return join(dir(root), `${issue}.json`);
}

export async function readState(root: string, issue: number): Promise<IssueState | undefined> {
  try {
    return JSON.parse(await readFile(file(root, issue), 'utf8')) as IssueState;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return undefined;
    }
    throw new Error(`the state of #${issue} cannot be read: ${(error as Error).message}`);
  }
}

export async function writeState(root: string, state: IssueState): Promise<void> {
  await mkdir(dir(root), { recursive: true });
  await writeFile(file(root, state.issue), `${JSON.stringify(state, null, 2)}\n`);
}

export async function dropState(root: string, issue: number): Promise<void> {
  await rm(file(root, issue), { force: true });
}

export async function savedIssues(root: string): Promise<number[]> {
  const names = await readdir(dir(root)).catch(() => []);
  return names.flatMap((name) => {
    const match = /^(\d+)\.json$/.exec(name);
    return match === null ? [] : [Number(match[1])];
  });
}
