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

// We use nconf in dependencies, so we have to play games here. If npm/yarn
// factors nconf up node_modules then our dependencies get the same nconf
// instance as we do, allowing them to mutate each others keys. This ensures we
// get our own nconf --- yes it is ugly. Thank you node.js for assuming we
// always want your hidden cache.
delete require.cache[require.resolve('nconf')];

var nconf = require('nconf');
var fs = require('fs');
var _ = require('lodash');
var debug = require('debug')('info');

nconf.use('memory');

// Order of precedence: argv, env, config file, defaults
nconf.argv();
nconf.env();

// Load an external (optional) config file from command-line args, but
// only if we're running standalone and not included as a library.
// index.js sets this global variable since it's the only one that knows
// if it's a library or not.
if (!global.isLibrary) {
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

// If there is an endpointsPrefix, update all the endpoints to include the
// prefix before returning:
const pfx = nconf.get('endpointsPrefix');
if (typeof pfx === 'string') {
  debug('config: Adding supplied prefix '+pfx+' to all endpoints');
  const endpoints = nconf.get('endpoints');
  _.mapValues(endpoints, (v,k) => {
    nconf.set('endpoints:'+k, pfx+v);
  });
}


module.exports = nconf;
