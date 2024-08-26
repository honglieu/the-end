var replace = require('replace-in-file');
var buildVersion = Date.now();
var options = {
  files: [
    'src/assets/js/version.json',
    'src/app/sentry/index.ts',
    'package.json'
  ],
  from: /{BUILD_VERSION}/g,
  to: buildVersion,
  allowEmptyPaths: false
};

try {
  replace.sync(options);
  console.log('Build version set: ' + buildVersion);
} catch (error) {
  console.error('Error occurred:', error);
}
