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
var debug = require('debug')('info');

function findById(id, cb) {
  debug('retrieving client { clientId: "'+id+'" }');
  return db.clients.firstExample({clientId: id})
  .then(client => {
    if (!client) return cb(null,null);
    cb(null,client);
  }).catch(err => {
    if (err.code === 404) return cb(null,null); // it's ok if client is not found
    cb(err)
  });
}

function save(client, cb) {
  debug('saving clientId ',client.clientId);
  return db.clients.save(client)
  .then(() => findById(client.clientId,cb))
  .catch(err => {
    cb(err);
  })
}

module.exports = {
  findById: findById,
  save: save
};
