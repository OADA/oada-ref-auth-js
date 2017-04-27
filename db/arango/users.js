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

var bcrypt = require('bcryptjs');

var config = require('../../config');
var db = require('./db.js');

function findById(id, cb) {
  db.users.document(id)
  .then(user => {
    if (!user) return cb('User not found',false);
    // Rename arango's _key
    user._id = user._key;
    return cb(null, user);
  }).catch(err => cb(err));
}

function findByUsername(username, cb) {
  db.users.firstExample({username: username})
  .then(user => {
    if (!user) return cb('User not found',false);
    // Rename arango's _id
    user._id = user._key;
    return cb(null, user);
  }).catch(err => cb(err));
}

function findByUsernamePassword(username, password, cb) {
  let user = null;
  return db.users.firstExample({username: username})
  .then(u => {
    user = u;
    if (!user) throw 'User not found';
    return bcrypt.compare(password,user.password);
  }).then(thesame => {
    if (!thesame) return cb('User not found',false);
    // Rename arango's _key
    user._id = user._key;
    return cb(null, user);
  }).catch(err => cb(err));
}

module.exports = {
  findById: findById,
  findByUsernamePassword: findByUsernamePassword,
  findByUsername: findByUsername,
};
