import { build as tsupBuild } from 'tsup';
import yargs from 'yargs';

const CORE_DIR = 'dist';
const SCRIPTS_DIR = 'bin';

const argv = yargs(process.argv.slice(2)).options({
  target: {
    alias: 't',
    type: 'string',
    description: 'Build target',
    choices: ['all', 'core', 'scripts'],
    default: 'all'
  },
  silent: {
    alias: 's',
    type: 'boolean',
    description: 'Silent mode',
    default: false
  },
  clean: {
    alias: 'c',
    type: 'boolean',
    description: 'Clean out files before build',
    default: false
  },
}).strict().parseSync();

const config = {
  splitting: false, // don't split code into chunks
  platform: 'node', // environment to build for
  target: 'node20',
  format: 'esm',
  silent: argv.silent,
  clean: argv.clean,
}

const CORE_BUILD = {
  ...config,
  outDir: CORE_DIR,
  entry: {
    index: 'src/core/index.ts',
  },
}

const SCRIPTS_BUILD = {
  ...config,
  outDir: SCRIPTS_DIR,
  entry: ['src/scripts/*'],
}

async function build(buildConfig, buildTarget) {
  try {
    await tsupBuild(buildConfig);
  } catch (e) {
    console.error(`Failed to build ${buildTarget}:`, e);
    process.exit(1);
  }
}

switch(argv.target) {
  case 'all':
    await build(CORE_BUILD, 'core');
    await build(SCRIPTS_BUILD, 'scripts');
    break;
  case 'core':
    await build(CORE_BUILD, 'core');
    break;
  case 'scripts':
    await build(SCRIPTS_BUILD, 'scripts');
    break;
}
