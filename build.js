import { build as tsupBuild } from 'tsup';
import { replaceTscAliasPaths } from 'tsc-alias';
import yargs from 'yargs';

const CORE_DIR = 'dist';
const SCRIPTS_DIR = 'bin';
const isDocker = process.env.DOCKER === 'true';

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
  external: isDocker ? ['@config'] : [], // Don't resolve @config modules when building in docker
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

/**
 * Resolve paths after the build process because ESBuild only supports path
 * resolution natively during bundling.
 *
 * "@config/" paths are replaced with relative-path "./" to allow for
 * non-bundling scenarios like Docker.
 */
async function replaceConfigAliasPaths(outDir) {
    await replaceTscAliasPaths({
      configFile: 'tsconfig.json',
      outDir: outDir,
      watch: false,
      replacers: ['build.config-alias-replacer.cjs']
    });
  }

async function build(buildConfig, buildTarget) {
  try {
    await tsupBuild(buildConfig);

    if (isDocker) {
      await replaceConfigAliasPaths(buildConfig.outDir);
    }
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
