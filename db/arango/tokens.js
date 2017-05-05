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

var db = require('./db.js');
var _ = require('lodash');
var trace = require('debug')('arango:token/trace');
var oadaLib = require('oada-lib-arangodb');

function findByToken(token, cb) {
  trace('findByToken: searching for token ', token);
  oadaLib.tokens.findByToken(token).asCallback(cb);
}

function save(token, cb) {
  token = _.cloneDeep(token);
  // Link user
  token.user = {_id: token.user._id};
  trace('save: saving token ', token);
  oadaLib.tokens.save(token).asCallback(cb);
}

module.exports = {
  findByToken: findByToken,
  save: save,
};
