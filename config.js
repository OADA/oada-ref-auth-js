/* Copyright 2014 Open Ag Data Alliance
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

var nconf = require('nconf');
var fs = require('fs');

nconf.use('memory');

// Order of precedence: argv, env, config file, defaults
nconf.argv();
nconf.env({whitelist: 'config'});

// Load an external (optional) config file
var config = nconf.get('config');
if (config) {
  if (!fs.existsSync(config)) {
    throw new Error('Could not find config file: ' + config);
  }
  if (config.match(/\.json$/)) {
    nconf.file(config);
  } else {
    // .JS file instead, so require it rather than nconf.file it:
    nconf.use('literal', require(config));
  }
}

nconf.defaults(require('./config.defaults.js'));

nconf.setObject = function(object, path) {
  path = path || '';

  Object.keys(object).forEach(function(key) {
    if(typeof object[key] === '[object]') {
      nconf.setObject(object[key], path + key + ':');
    } else {
      nconf.set(path + key, object[key]);
    }
  });
}

module.exports = nconf;
