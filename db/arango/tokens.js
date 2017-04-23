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
var users = require('./users.js');
var _ = require('lodash');

function findByToken(token, cb) {
  return db.tokens.firstExample({token: token})
  .then(dbtoken => {
    if (!dbtoken) return cb('Token not found');
    // Overwrite arango's _id
    dbtoken._id = dbtoken._key;
    // Populate user
    users.findById(dbtoken.user._id, function(err, user) {
      if (err) { return cb(err); }
      dbtoken.user = user;
      return cb(null, dbtoken);
    });
  }).catch(err => cb(err));
}

function save(token, cb) {
  token = _.cloneDeep(token);
  // Link user
  token.user = {_id: token.user._id};
  return db.tokens.save(token)
  .then(() => findByToken(token.token, cb))
  .catch(err => cb(err));
}

module.exports = {
  findByToken: findByToken,
  save: save,
};
