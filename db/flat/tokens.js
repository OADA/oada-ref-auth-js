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

var tokens = require('./tokens.json');

var tokenModel = require('../models/token');

function lookup(token, cb) {
  cb(null, tokenModel(token));
}

function save(t, cb) {
  var token;

  if (t.isValid === undefined) {
    token = tokenModel(t);
  } else {
    token = t;
  }

  token.scope = token.scope || [];

  if (!token.isValid()) {
    return cb(new Error('Invalid token'));
  }

  if (tokens[token.token] !== undefined) {
    return cb(new Error('Token already exists'));
  }

  if (typeof token.expiresIn !== 'number') {
    token.expiresIn = 60;
  }

  token.id = Object.keys(tokens).length + 1;
  token.createTime = new Date().getTime();

  tokens[token.token] = JSON.parse(JSON.stringify(token));

  cb(null, tokenModel(token));
}

module.exports = {
  lookup: lookup,
  save: save,
};
