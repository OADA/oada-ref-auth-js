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

var codes = require('./codes.json');

var codeModel = require('../models/code');

function lookup(code, cb) {
  cb(null, codeModel(codes[code]));
}

function save(c, cb) {
  var code;

  if (c.isValid === undefined) {
    code = codeModel(c);
  } else {
    code = c;
  }

  code.scope = code.scope || [];

  if (!code.isValid()) {
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

  cb(null, codeModel(code));
}

module.exports = {
  lookup: lookup,
  save: save,
};
