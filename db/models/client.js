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

var config = require('../../config');
var db = require('../../' + config.datastores.clients);

function makeClient(client) {
  // No model needed (yet)
  return client;
}

function findById(id, cb) {
  console.log(db);
  db.findById(id, function(err, c) {
    var client;
    if (!err) {
      client = makeClient(c);
    }

    cb(err, client);
  });
}

module.exports = {
  findById: findById
};
