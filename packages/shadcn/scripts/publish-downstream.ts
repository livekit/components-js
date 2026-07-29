import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildRegistry } from './lib/publish-utils.ts';
import { publishAgentStarterReact } from './publish-agent-starter-react.ts';
import { publishLivekitWeb } from './publish-livekit-web.ts';

type Result = { name: string; success: boolean; skipped?: boolean; prUrl?: string; error?: string };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHADCN_PKG_DIR = path.join(__dirname, '..');

async function runAgentStarterReact(): Promise<Result> {
  try {
    const result = await publishAgentStarterReact({ registryAlreadyBuilt: true });
    return { name: 'agent-starter-react', ...result };
  } catch (err) {
    return { name: 'agent-starter-react', success: false, error: String(err) };
  }
}

async function runLivekitWeb(): Promise<Result> {
  try {
    const result = await publishLivekitWeb({ registryAlreadyBuilt: true });
    return { name: 'livekit-web', ...result };
  } catch (err) {
    return { name: 'livekit-web', success: false, error: String(err) };
  }
}

function printSummary(results: Result[]): void {
  console.log('--------------------------------');
  console.log('Summary');
  for (const result of results) {
    const status = !result.success ? '❌' : result.skipped ? '⏭  skipped' : '✅';
    console.log(
      `${status} ${result.name}${result.prUrl ? ` — ${result.prUrl}` : ''}${result.error ? ` — ${result.error}` : ''}`,
    );
  }
}

async function publishDownstream(): Promise<Result[]> {
  buildRegistry(SHADCN_PKG_DIR);
  const results: Result[] = [];
  results.push(await runAgentStarterReact());
  results.push(await runLivekitWeb());
  return results;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const results = await publishDownstream();
  printSummary(results);
  process.exitCode = results.some((r) => !r.success) ? 1 : 0;
}
