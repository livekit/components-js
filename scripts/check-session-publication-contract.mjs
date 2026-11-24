import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Compile both sides of the private bridge against one SDK type universe. This adds no exports
// to either package, and can run against the companion checkout before either PR is released.
const root = fileURLToPath(new URL('../', import.meta.url));
const sdk = resolve(process.env.LIVEKIT_SDK_DIR ?? join(root, '../client-sdk-js'));
const require = createRequire(join(sdk, 'package.json'));
const ts = require('typescript');
const source = await readFile(join(root, 'packages/react/src/hooks/sessionPublication.ts'), 'utf8');
const ast = ts.createSourceFile('bridge.ts', source, ts.ScriptTarget.Latest, true);
const names = ['Reservation', 'PublicationIntent', 'SessionPublicationBridge'];
const declarations = ast.statements.filter(
  (node) => ts.isInterfaceDeclaration(node) && names.includes(node.name.text),
);
assert.equal(
  declarations.length,
  names.length,
  'Private bridge declarations changed; update check',
);
const directory = await mkdtemp(join(sdk, '.session-contract-'));
try {
  const fixture = join(directory, 'contract.ts');
  await writeFile(
    fixture,
    `
import type { Room, Track, LocalTrack, LocalTrackPublication, TrackPublishOptions } from '../src/index';
import type { SessionPublicationBridge as SDKBridge } from '../src/room/sessionPublication';
${declarations.map((node) => node.getText(ast)).join('\n')}
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
// Session intentionally prepares only the microphone subset of the SDK's internal capability.
export type Intent = Assert<Equal<PublicationIntent,
  Extract<Parameters<SDKBridge['prepare']>[0], { source: Track.Source.Microphone }>>>;
export type Handle = Assert<Equal<Reservation, ReturnType<SDKBridge['prepare']>>>;
export type ConnectArguments = Assert<Equal<Parameters<SessionPublicationBridge['connect']>,
  Parameters<SDKBridge['connect']>>>;
export type ConnectResult = Assert<Equal<ReturnType<SessionPublicationBridge['connect']>,
  ReturnType<SDKBridge['connect']>>>;
`,
  );
  const configPath = ts.findConfigFile(sdk, ts.sys.fileExists, 'tsconfig.json');
  assert.ok(configPath);
  const config = ts.readConfigFile(configPath, ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, sdk);
  const options = {
    ...parsed.options,
    noEmit: true,
    noUnusedLocals: false,
    typeRoots: [join(sdk, 'node_modules/@types')],
  };
  const host = ts.createCompilerHost(options);
  host.getCurrentDirectory = () => sdk;
  const program = ts.createProgram([...parsed.fileNames, fixture], options, host);
  const diagnostics = ts.getPreEmitDiagnostics(program);
  if (diagnostics.length) {
    throw new Error(
      ts.formatDiagnosticsWithColorAndContext(diagnostics, {
        getCanonicalFileName: (name) => name,
        getCurrentDirectory: () => sdk,
        getNewLine: () => '\n',
      }),
    );
  }
  console.log('Internal Session publication bridge contract matches the companion SDK.');
} finally {
  await rm(directory, { recursive: true, force: true });
}
