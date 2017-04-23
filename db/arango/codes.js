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

function findByCode(code, cb) {
  db.codes.firstExample({code: code})
  .then(dbcode => {
    if (!dbcode) return cb('Code not found');
    // Rename arango's _id
    dbcode._id = dbcode._key;
    // Populate user
    users.findById(dbcode.user._id, function(err, user) {
      if (err) { return cb(err); }
      dbcode.user = user;
      cb(null, dbcode);
    });
  }).catch(err => cb(err));
}

function save(code, cb) {
  code = _.cloneDeep(code);
  // Link user
  code.user = {_id: code.user._id};

  db.codes.save(code)
  .then(() => findByCode(code.code,cb))
  .catch(err => cb(err));
}

module.exports = {
  findByCode: findByCode,
  save: save,
};
