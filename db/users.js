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

var users = [
  {
    'id': 1,
    'username': 'frank',
    'password': 'pass',
    'name': 'Farmer Frank',
    'family_name': 'Frank',
    'given_name': 'Farmer',
    'middle_name': '',
    'nickname': 'Frankie',
    'email': 'frank@openag.io'
  }
];

module.exports.findById = function(id, cb) {
  for (var idx in users) {
    if (users[idx].id == id) {
      return cb(null, users[idx]);
    }
  }

  cb(null, false);
};

module.exports.findByUsername = function(username, cb) {
  for (var idx in users) {
    if (users[idx].username == username) {
      return cb(null, users[idx]);
    }
  }

  cb(null, false);
};
