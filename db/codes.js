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

var codes = {
  /*
  'xyz': {
    'id': 1,
    'code': 'xyz',
    'scope': [],
    'nonce': undefined,
    'user': {},
    'createTime': 1413831649937,
    'expiresIn': 60,
    'redeemed': true,
    'clientId': 'jf93caauf3uzud7f308faesf3@provider.oada-dev.com',
    'redirectUri': 'http://client.oada-dev.com/redirect',
  }
  */
};

var URI = require('URIjs');

function makeCode(code) {
  if (codes[code] === undefined) {
    return false;
  }

  var c = codes[code];

  c.isExpired = function() {
    return (this.createTime + this.expiresIn > new Date().getTime());
  };

  c.matchesClientId = function(clientId) {
    return this.clientId === clientId;
  };

  c.matchesRedirectUri = function(redirectUri) {
    return URI(this.redirectUri).equals(redirectUri);
  };

  c.isRedeemed = function() {
    return this.redeemed;
  };

  c.redeem = function() {
    return (this.redeemed = true);
  };

  return c;
}

module.exports.lookup = function(code, cb) {
  cb(null, makeCode(code));
};

module.exports.save = function(code, cb) {
  code.scope = code.scope || [];

  if (typeof code.code !== 'string' ||
     !Array.isArray(code.scope) ||
     typeof code.user !== 'object' ||
     typeof code.clientId != 'string' ||
     typeof code.redirectUri != 'string') {
    return cb(new Error('Invalid code'));
  }

  if (codes[code.code] !== undefined) {
    return cb(new Error('Code already exists'));
  }

  if (typeof code.expiresIn !== 'number') {
    code.expiresIn = 60;
  }

  code.id = Object.keys(codes).length + 1;
  code.createTime = new Date().getTime();
  code.redeemed = false;

  codes[code.code] = JSON.parse(JSON.stringify(code));

  cb(null, makeCode(code.code));
};
