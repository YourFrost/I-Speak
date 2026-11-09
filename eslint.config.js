const expo = require('eslint-config-expo/flat');
module.exports = [...expo, { ignores: ['dist/*', 'android/*', 'node_modules/*'] }];
