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

var debug = require('debug')('mongo-codes');
var db = require('./mongo.js');

var codeModel = require('../models/code');

var config = require('../../config');
var users = require('../../' + config.datastores.users);

function lookup(code, cb) {
  db.codes.findOne({code: code}, function(err, code) {
    if (err) { debug(err); }

    if (code) {
      code.id = code._id;

      // Populate user
      users.findById(code.user._id, function(err, user) {
        if (err) { debug(err); return cb(err); }

        code.user = user;

        cb(null, codeModel(code));
      });
    } else {
      cb(err);
    }
  });
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

  lookup(code.code, function(err, c) {
    if (err) { debug(err); return cb(err); }

    if (c) {
      return cb(new Error('Code already exists'));
    }

    if (typeof code.expiresIn !== 'number') {
      code.expiresIn = 60;
    }

    code.createTime = new Date().getTime();
    code.redeemed = false;

    // Link user
    code.user = {_id: code.user._id};

    db.codes.save(code, function(err) {
      if (err) { debug(err); return cb(err); }

      lookup(code.code, cb);
    });
  });
}

module.exports = {
  lookup: lookup,
  save: save
};
