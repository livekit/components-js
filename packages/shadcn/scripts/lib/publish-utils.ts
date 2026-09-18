import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
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

export function buildRegistry(shadcnPkgDir: string): void {
  console.log('--------------------------------');
  console.log('Building registry');
  run(['pnpm', 'shadcn:build'], { cwd: shadcnPkgDir });
}

export function installDependencies(cwd: string): void {
  console.log('--------------------------------');
  console.log('Installing dependencies');
  run(['pnpm', 'install'], { cwd });
}

export function formatChanges(cwd: string, cmd: string[] = ['pnpm', 'format']): void {
  console.log('--------------------------------');
  console.log('Formatting changes');
  run(cmd, { cwd });
}

export async function serveRegistry(shadcnPkgDir: string, port: number): Promise<ChildProcess> {
  console.log('--------------------------------');
  console.log(`Serving registry on port ${port}`);
  const server = spawn('python3', ['-m', 'http.server', String(port), '-d', './dist'], {
    cwd: shadcnPkgDir,
    stdio: 'ignore',
  });
  await waitForHttp(`http://localhost:${port}/r/registry.json`);
  return server;
}

export function pointRegistryAt(componentsJsonPath: string, registryUrl: string): void {
  console.log('--------------------------------');
  console.log(`Pointing ${componentsJsonPath} at ${registryUrl}`);
  const componentsJson = JSON.parse(fs.readFileSync(componentsJsonPath, 'utf-8'));
  componentsJson.registries['@agents-ui'] = registryUrl;
  fs.writeFileSync(componentsJsonPath, JSON.stringify(componentsJson, null, 2) + '\n');
}

export function revertFile(cwd: string, relativePath: string): void {
  console.log('--------------------------------');
  console.log(`Reverting temporary change to ${relativePath}`);
  run(['git', 'checkout', '--', relativePath], { cwd });
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

/**
 * killServer() sends SIGTERM without waiting for the process to actually exit, so a
 * server killed at the end of one publish run may still hold the port for a moment
 * when the next run starts (e.g. back-to-back in publish-downstream.ts). Poll instead
 * of failing immediately on the first check.
 */
export async function waitForPortFree(port: number, timeoutMs = 5_000): Promise<void> {
  const start = Date.now();
  while (isPortInUse(port)) {
    if (Date.now() - start > timeoutMs) {
      throw new Error(
        `Port ${port} is already in use. Stop any running shadcn:serve process and try again.`,
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
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

export function hasCliFlag(...flags: string[]): boolean {
  return process.argv.slice(2).some((arg) => flags.includes(arg));
}

export function onInterrupt(cleanup: () => void): () => void {
  const handler = () => {
    cleanup();
    process.exit(1);
  };
  process.once('SIGINT', handler);
  process.once('SIGTERM', handler);
  return () => {
    process.off('SIGINT', handler);
    process.off('SIGTERM', handler);
  };
}

// A second readline.createInterface() on process.stdin after closing the first one
// never receives further input (it hangs indefinitely) — so when a single process
// prompts more than once (e.g. publish-downstream.ts running both publish scripts
// in-process), all prompts must share one interface, closed exactly once at exit
// via closePromptInterface().
let sharedPromptInterface: readline.Interface | undefined;

function getPromptInterface(): readline.Interface {
  sharedPromptInterface ??= readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return sharedPromptInterface;
}

export function closePromptInterface(): void {
  sharedPromptInterface?.close();
  sharedPromptInterface = undefined;
}

export async function promptYesNo(question: string): Promise<boolean> {
  const rl = getPromptInterface();
  const answer = await rl.question(`${question} (y/N): `);
  return ['y', 'yes'].includes(answer.trim().toLowerCase());
}

export function cloneAndCreateBranch(
  repo: string,
  tmpDirPrefix: string,
  branchPrefix: string,
  baseBranch: string,
): { tmpDir: string; branch: string } {
  const tmpDir = mkTempClone(tmpDirPrefix);
  console.log('--------------------------------');
  console.log(`Cloning ${repo} (${baseBranch}, depth 1) into ${tmpDir}`);
  // Shallow, single-branch clone: this helper is only ever used to branch off the
  // tip of baseBranch, diff, commit, and push — never git log/blame/tags. Don't
  // reuse this path for a caller that needs history beyond HEAD.
  run([
    'gh',
    'repo',
    'clone',
    repo,
    tmpDir,
    '--',
    '--depth',
    '1',
    '--single-branch',
    '--branch',
    baseBranch,
    '--no-tags',
  ]);

  const branch = branchName(branchPrefix);
  run(['git', 'checkout', '-b', branch, `origin/${baseBranch}`], { cwd: tmpDir });

  return { tmpDir, branch };
}

async function confirmPrCreation(opts: {
  repo: string;
  cwd: string;
  branch: string;
  base: string;
  title: string;
  body: string;
  autoApprove?: boolean;
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

  if (opts.autoApprove) {
    console.log('Auto-approved (-y)');
    return true;
  }

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
  autoApprove?: boolean;
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
