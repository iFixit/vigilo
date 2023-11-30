import { build } from 'tsup';

await build({
  entry: {
    index: 'src/core/index.ts',
    createDashboard: 'src/scripts/createDashboard.ts',
    updateDatadogMetricMetadata: 'src/scripts/updateDatadogMetricMetadata.ts',
  },
  splitting: false, // don't split code into chunks
  clean: true,
  platform: 'node', // environment to build for
  target: 'node20',
  outDir: 'dist',
  format: 'esm',
});