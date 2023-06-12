import * as path from 'path';
import type { ExtractorResult } from '@microsoft/api-extractor';
import { Extractor, ExtractorConfig } from '@microsoft/api-extractor';

const apiExtractorJsonPath = path.join('../../packages/react/api-extractor.json');
console.log({ apiExtractorJsonPath });

// Load and parse the api-extractor.json file
const extractorConfig: ExtractorConfig = ExtractorConfig.loadFileAndPrepare(apiExtractorJsonPath);

// Invoke API Extractor
const extractorResult: ExtractorResult = Extractor.invoke(extractorConfig, {
  // Equivalent to the "--local" command-line parameter
  localBuild: true,
  // Equivalent to the "--verbose" command-line parameter
  showVerboseMessages: true,
});

if (extractorResult.succeeded) {
  console.log(` API Extractor completed successfully`);
  process.exitCode = 0;
} else {
  console.error(
    `API Extractor completed with ${extractorResult.errorCount} errors` +
      ` and ${extractorResult.warningCount} warnings`,
  );
  process.exitCode = 1;
}
