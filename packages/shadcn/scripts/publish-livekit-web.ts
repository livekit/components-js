import { type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  buildRegistry,
  cloneAndCreateBranch,
  commitPushAndOpenPr,
  closePromptInterface,
  ghAuthPreflight,
  hasCliFlag,
  hasDiff,
  installDependencies,
  killServer,
  onInterrupt,
  pointRegistryAt,
  removeTempDir,
  revertFile,
  run,
  runCapture,
  serveRegistry,
  waitForPortFree,
} from './lib/publish-utils.ts';

type PublishOptions = {
  registryAlreadyBuilt?: boolean;
  autoApprove?: boolean;
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHADCN_PKG_DIR = path.join(__dirname, '..');
const ENV_LOCAL_PATH = path.join(SHADCN_PKG_DIR, '.env.local');
const REPO = 'livekit/web';
const PORT = 3210;
const REGISTRY_URL = `http://localhost:${PORT}/r/{name}.json`;
const BASE_BRANCH = 'main';
const BRANCH_PREFIX = 'chore/update-agents-ui-registry';
const COMMIT_MESSAGE = 'chore(agents-ui): update registry + prop-types from @livekit/agents-ui';
const PR_TITLE = 'chore(agents-ui): update registry + prop-types';
const AGENTS_UI_PACKAGE_DIR = 'packages/agents-ui';
const AGENTS_UI_PACKAGE_NAME = '@repo/agents-ui';
// shadcn add doesn't know about pnpm's catalog: protocol — it overwrites these with a
// concrete version pinned to whatever the @agents-ui registry entry declares. Restore
// the workspace's catalog reference afterward so we don't fork these off the catalog.
const CATALOG_DEPENDENCIES = ['@livekit/components-react', 'livekit-client'];
// The public shadcn registry now imports `cn` from the `cn` package: lib/utils.ts becomes
// `export { cn } from "cn"` and the ui components import "cn" directly. The livekit/web
// build adds the `shadcn` class inside `twMerge(clsx(inputs))` in lib/utils.ts, so every
// `cn` call must go through that file. Keep livekit/web's copy of it, point the "cn"
// imports back at it, and drop the added dependency.
const UTILS_PATH = path.join(AGENTS_UI_PACKAGE_DIR, 'src/lib/utils.ts');
const UTILS_ALIAS = '@/lib/utils';
const UNWANTED_DEPENDENCIES = ['cn'];

function writeTempEnvLocal(tmpDir: string): void {
  console.log('--------------------------------');
  console.log('Pointing .env.local at the tmp livekit/web checkout');
  const destRegistryPath = path.join(tmpDir, 'apps/www/app/ui/r/_registry');
  const destPropTypesPath = path.join(tmpDir, 'apps/docs/lib/shadcn/prop-types.json');
  fs.writeFileSync(
    ENV_LOCAL_PATH,
    `DEST_REGISTRY_PATH=${destRegistryPath}\nDEST_PROP_TYPES_PATH=${destPropTypesPath}\n`,
  );
}

function copyRegistryFiles(): void {
  console.log('--------------------------------');
  console.log('Copying built registry into the tmp livekit/web checkout');
  run(['node', '--experimental-strip-types', '--env-file=.env.local', './scripts/update.ts'], {
    cwd: SHADCN_PKG_DIR,
  });
}

function restoreDependencies(packageJsonPath: string): void {
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  let changed = false;

  for (const section of ['dependencies', 'devDependencies', 'peerDependencies']) {
    const deps = pkg[section];
    if (!deps) continue;
    for (const name of CATALOG_DEPENDENCIES) {
      if (name in deps && deps[name] !== 'catalog:') {
        deps[name] = 'catalog:';
        changed = true;
      }
    }
    for (const name of UNWANTED_DEPENDENCIES) {
      if (name in deps) {
        delete deps[name];
        changed = true;
      }
    }
  }

  if (changed) {
    console.log('--------------------------------');
    console.log(`Restoring dependencies in ${packageJsonPath}`);
    fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n');
  }
}

function restoreUtilsImports(dir: string): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      restoreUtilsImports(entryPath);
    } else if (/\.tsx?$/.test(entry.name)) {
      const before = fs.readFileSync(entryPath, 'utf-8');
      const after = before.replace(/(\bfrom\s+)(['"])cn\2/g, `$1$2${UTILS_ALIAS}$2`);
      if (after !== before) {
        console.log(`Restoring ${UTILS_ALIAS} import in ${entryPath}`);
        fs.writeFileSync(entryPath, after);
      }
    }
  }
}

function installAgentsUiComponents(tmpDir: string): void {
  const componentsJsonPath = path.join(tmpDir, AGENTS_UI_PACKAGE_DIR, 'components.json');
  pointRegistryAt(componentsJsonPath, REGISTRY_URL);

  console.log('--------------------------------');
  console.log(`Installing agents-ui components in ${AGENTS_UI_PACKAGE_DIR}`);
  // These are the steps of livekit/web's `update` script, run one at a time so that
  // the files shadcn must not change are restored before the build.
  const packageDir = path.join(tmpDir, AGENTS_UI_PACKAGE_DIR);
  run(['pnpm', 'dlx', 'shadcn@latest', 'add', '--yes', '--overwrite', '@agents-ui/all'], {
    cwd: packageDir,
  });

  revertFile(tmpDir, path.join(AGENTS_UI_PACKAGE_DIR, 'components.json'));
  revertFile(tmpDir, UTILS_PATH);
  restoreUtilsImports(path.join(packageDir, 'src'));

  const packageJsonPath = path.join(packageDir, 'package.json');
  const before = fs.readFileSync(packageJsonPath, 'utf-8');
  restoreDependencies(packageJsonPath);
  if (fs.readFileSync(packageJsonPath, 'utf-8') !== before) {
    installDependencies(tmpDir);
  }

  run(['pnpm', '--filter', AGENTS_UI_PACKAGE_NAME, 'run', 'codegen'], { cwd: tmpDir });
  run(['pnpm', '--filter', AGENTS_UI_PACKAGE_NAME, 'run', 'format'], { cwd: tmpDir });
}

function restoreEnvLocal(hadEnvLocal: boolean, envBackup: string | null): void {
  if (hadEnvLocal && envBackup !== null) {
    fs.writeFileSync(ENV_LOCAL_PATH, envBackup);
  } else {
    fs.rmSync(ENV_LOCAL_PATH, { force: true });
  }
}

function buildPrBody(sourceSha: string): string {
  return `Updates \`apps/www/agents-ui-registry\`, \`apps/docs/lib/shadcn/prop-types.json\`, and the installed \`@agents-ui\` components in \`${AGENTS_UI_PACKAGE_DIR}\` from the latest build of [livekit/components-js](https://github.com/livekit/components-js) at ${sourceSha}.\n\nGenerated by \`packages/shadcn/scripts/publish-livekit-web.ts\`.`;
}

export async function publishLivekitWeb(options: PublishOptions = {}): Promise<{
  success: boolean;
  skipped?: boolean;
  prUrl?: string;
}> {
  ghAuthPreflight();
  await waitForPortFree(PORT);

  let server: ChildProcess | undefined;
  let tmpDir: string | undefined;
  const hadEnvLocal = fs.existsSync(ENV_LOCAL_PATH);
  const envBackup = hadEnvLocal ? fs.readFileSync(ENV_LOCAL_PATH, 'utf-8') : null;
  const cleanup = () => {
    killServer(server);
    restoreEnvLocal(hadEnvLocal, envBackup);
    removeTempDir(tmpDir);
  };
  const unregisterInterruptHandler = onInterrupt(cleanup);

  try {
    if (!options.registryAlreadyBuilt) {
      buildRegistry(SHADCN_PKG_DIR);
    }
    server = await serveRegistry(SHADCN_PKG_DIR, PORT);

    const cloned = cloneAndCreateBranch(REPO, 'livekit-web-', BRANCH_PREFIX, BASE_BRANCH);
    tmpDir = cloned.tmpDir;

    writeTempEnvLocal(tmpDir);
    copyRegistryFiles();
    installDependencies(tmpDir);
    installAgentsUiComponents(tmpDir);

    if (!hasDiff(tmpDir)) {
      console.log('No changes after sync — skipping PR');
      return { success: true, skipped: true };
    }

    const sourceSha = runCapture(['git', 'rev-parse', 'HEAD'], { cwd: SHADCN_PKG_DIR });
    const prUrl = await commitPushAndOpenPr({
      repo: REPO,
      cwd: tmpDir,
      branch: cloned.branch,
      base: BASE_BRANCH,
      title: PR_TITLE,
      body: buildPrBody(sourceSha),
      commitMessage: COMMIT_MESSAGE,
      autoApprove: options.autoApprove,
    });

    if (!prUrl) {
      return { success: true, skipped: true };
    }
    return { success: true, prUrl };
  } finally {
    unregisterInterruptHandler();
    cleanup();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  publishLivekitWeb({ autoApprove: hasCliFlag('-y', '--yes') })
    .then((result) => {
      console.log('Done', result);
    })
    .catch((err) => {
      console.error(err);
      process.exitCode = 1;
    })
    .finally(() => closePromptInterface());
}
