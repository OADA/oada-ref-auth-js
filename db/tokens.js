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

var tokens = {
  /*
  "xyz": {
    'id': 1,
    'token': 'xyz',
    'createTime': 1413831649937,
    'expiresIn': 60,
    'user': {},
    'clientId': 'jf93caauf3uzud7f308faesf3@provider.oada-dev.com',
  }
  */
};

var URI = require('URIjs');

function makeToken(token) {
  if(tokens[token] === undefined) {
    return false;
  }

  var t = tokens[token];

  t.isExpired = function() {
    return (this.createTime + this.expiresIn < new Date().getTime());
  }

  return t;
}

module.exports.lookup = function(token, cb) {
  cb(null, makeToken(token));
};

module.exports.save = function(token, cb) {
  token.scope = token.scope || [];

  if(typeof token.token !== 'string' ||
     !Array.isArray(token.scope) ||
     typeof token.user !== 'object' ||
     typeof token.clientId != 'string') {
       return cb(new Error('Invalid token'));
  }

  if(tokens[token.token] !== undefined) {
    return cb(new Error('Token already exists'));
  }

  if(typeof token.expiresIn !== 'number') {
    token.expiresIn = 60;
  }

  token.id = Object.keys(tokens).length+1;
  token.createTime = new Date().getTime();

  tokens[token.token] = JSON.parse(JSON.stringify(token));

  cb(null, makeToken(token.token));
}
