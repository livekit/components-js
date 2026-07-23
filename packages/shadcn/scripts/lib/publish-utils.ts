import { execFileSync, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline/promises';

export function run(cmd: string[], opts: { cwd?: string } = {}): void {
  execFileSync(cmd[0], cmd.slice(1), { cwd: opts.cwd, stdio: 'inherit' });
}

export function runCapture(cmd: string[], opts: { cwd?: string } = {}): string {
  return execFileSync(cmd[0], cmd.slice(1), { cwd: opts.cwd, stdio: ['ignore', 'pipe', 'pipe'] })
    .toString()
    .trim();
}

export function mkTempClone(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

export function hasDiff(cwd: string): boolean {
  return runCapture(['git', 'status', '--porcelain'], { cwd }).length > 0;
}

export function ghAuthPreflight(): void {
  try {
    execFileSync('gh', ['auth', 'status'], { stdio: 'ignore' });
  } catch {
    throw new Error('gh CLI is not authenticated. Run `gh auth login` and try again.');
  }
}

export function isPortInUse(port: number): boolean {
  try {
    const pids = execFileSync('lsof', ['-ti', `tcp:${port}`], {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
    return pids.length > 0;
  } catch {
    return false;
  }
}

export async function waitForHttp(url: string, timeoutMs = 10_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // server not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for ${url} to respond`);
}

export function branchName(prefix: string): string {
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\..+/, '')
    .replace('T', '-');
  return `${prefix}-${timestamp}`;
}

export function ghPrCreate(opts: {
  repo: string;
  cwd: string;
  title: string;
  body: string;
  head: string;
  base: string;
}): string {
  return runCapture(
    [
      'gh',
      'pr',
      'create',
      '--repo',
      opts.repo,
      '--title',
      opts.title,
      '--body',
      opts.body,
      '--head',
      opts.head,
      '--base',
      opts.base,
    ],
    { cwd: opts.cwd },
  );
}

export function killServer(server: ChildProcess | undefined): void {
  if (server && !server.killed) {
    server.kill();
  }
}

export function removeTempDir(dir: string | undefined): void {
  if (dir) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

export async function promptYesNo(question: string): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await rl.question(`${question} (y/N): `);
    return ['y', 'yes'].includes(answer.trim().toLowerCase());
  } finally {
    rl.close();
  }
}

export function cloneAndCreateBranch(
  repo: string,
  tmpDirPrefix: string,
  branchPrefix: string,
): { tmpDir: string; branch: string } {
  const tmpDir = mkTempClone(tmpDirPrefix);
  console.log('--------------------------------');
  console.log(`Cloning ${repo} into ${tmpDir}`);
  run(['gh', 'repo', 'clone', repo, tmpDir]);
  run(['git', 'fetch', 'origin', 'main'], { cwd: tmpDir });
  run(['git', 'reset', '--hard', 'origin/main'], { cwd: tmpDir });

  const branch = branchName(branchPrefix);
  run(['git', 'checkout', '-b', branch], { cwd: tmpDir });

  return { tmpDir, branch };
}

async function confirmPrCreation(opts: {
  repo: string;
  cwd: string;
  branch: string;
  base: string;
  title: string;
  body: string;
}): Promise<boolean> {
  const diffStat = runCapture(['git', 'diff', '--stat'], { cwd: opts.cwd });

  console.log('--------------------------------');
  console.log('About to open a pull request:');
  console.log(`  Repo:   ${opts.repo}`);
  console.log(`  Branch: ${opts.branch} -> ${opts.base}`);
  console.log(`  Title:  ${opts.title}`);
  console.log('  Body:');
  for (const line of opts.body.split('\n')) console.log(`    ${line}`);
  console.log('  Changes:');
  for (const line of diffStat.split('\n')) console.log(`    ${line}`);
  console.log('--------------------------------');

  return promptYesNo('Create this PR?');
}

export async function commitPushAndOpenPr(opts: {
  repo: string;
  cwd: string;
  branch: string;
  base: string;
  title: string;
  body: string;
  commitMessage: string;
}): Promise<string | undefined> {
  const confirmed = await confirmPrCreation(opts);
  if (!confirmed) {
    console.log('PR creation cancelled by user');
    return undefined;
  }

  run(['git', 'add', '-A'], { cwd: opts.cwd });
  run(['git', 'commit', '-m', opts.commitMessage], { cwd: opts.cwd });
  run(['git', 'push', '-u', 'origin', opts.branch], { cwd: opts.cwd });

  const prUrl = ghPrCreate({
    repo: opts.repo,
    cwd: opts.cwd,
    title: opts.title,
    body: opts.body,
    head: opts.branch,
    base: opts.base,
  });

  console.log('--------------------------------');
  console.log(`Opened PR: ${prUrl}`);
  return prUrl;
}
