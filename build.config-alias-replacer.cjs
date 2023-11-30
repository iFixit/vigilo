/**
 * File must be named with a .cjs extension to be recognized by tsc-alias and
 * work with the type: "module" setting in package.json.
 * @see https://github.com/justkey007/tsc-alias/discussions/73#discussioncomment-4416038
 */
const fs = require('fs');

/**
 * This script replaces '@config/' aliases with relative paths './' in the
 * provided file.
 * This is necessary for non-bundling scenarios like Docker, where we want to
 * use files from the host machine.
 * Without this, the referenced files would be bundled, which is not the
 * desired behavior in this case.
 */
function configAliasReplace({ orig, file }) {
  const fileContents = fs.readFileSync(file, 'utf8');
  const newContents = fileContents.replace(/@config\//g, './');
  fs.writeFileSync(file, newContents, 'utf8');
  return orig;
}

exports.default = configAliasReplace;