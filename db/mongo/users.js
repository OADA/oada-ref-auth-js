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

var debug = require('debug')('mongo-users');
var bcrypt = require('bcrypt');
var userModel = require('../models/user');

var db = require('./mongo.js');

function findById(id, cb) {
  db.users.findOne({_id: db.ObjectId(id)}, function(err, user) {
    if (err) { debug(err); }

    if (user) {
      user.id = user._id;

      cb(null, userModel(user));
    } else {
      cb(err, false);
    }
  });
}

function findByUsernamePassword(username, password, cb) {
  // Need to get config after config is finished being made. This modules
  // "constructor" is called within config.
  var config = require('../../config');
  var passwd =  bcrypt.hashSync(password, config.server.passwordSalt);

  db.users.findOne({username: username, password: passwd}, function(err, user) {
    if (err) { debug(err); }

    if (user) {
      user.id = user._id;

      cb(null, userModel(user));
    } else {
      cb(err, false);
    }
  });
}

module.exports = {
  findById: findById,
  findByUsernamePassword: findByUsernamePassword
};
