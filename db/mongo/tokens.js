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

var debug = require('debug')('mongo-tokens');
var db = require('./mongo.js');

var tokenModel = require('../models/token');

var config = require('../../config');
var users = require('../../' + config.datastores.users);

function lookup(token, cb) {
  db.tokens.findOne({token: token}, function(err, token) {
    if (err) { debug(err); }

    if (token) {
      token.id = token._id;

      // Populate user
      users.findById(token.user._id, function(err, user) {
        if (err) { debug(err); return cb(err); }

        token.user = user;

        cb(null, tokenModel(token));
      });
    } else {
      cb(err);
    }
  });
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

  lookup(token.token, function(err, t) {
    if (err) { debug(err); return cb(err); }

    if (t) {
      return cb(new Error('Token already exists'));
    }

    if (typeof token.expiresIn !== 'number') {
      token.expiresIn = 60;
    }

    token.createTime = new Date().getTime();

    // Link user
    token.user = {_id: token.user._id};

    db.tokens.save(token, function(err) {
      if (err) { debug(err); return cb(err); }

      lookup(token.token, cb);
    });
  });
}

module.exports = {
  lookup: lookup,
  save: save,
};
