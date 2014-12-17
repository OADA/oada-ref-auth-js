/* Copyriggtht 2014 Open Ag Data Alliance
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

var crypto = require('crypto');

var debug = require('debug')('a');
var TokenError = require('oauth2orize').TokenError;
var jwt = require('jsonwebtoken');
require('jws-jwk').shim();

var tokens = require('./db/tokens');
var codes = require('./db/codes');

var keys = require('./keys');
var config = require('./config');

function makeHash(length) {
  return crypto.randomBytes(Math.ceil(length * 3 / 4))
    .toString('base64')
    .slice(0, length)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function createIdToken(aud, sub, nonce) {
  var options = {
    algorithm: keys.sign[config.idToken.signKid].alg,
    expiresInMinutes: config.idToken.expiresIn/60,
    audience: aud,
    subject: sub,
    issuer: config.server.root
  };

  var payload = {
    iat: new Date().getTime()
  }

  if(nonce !== undefined) {
    payload.nonce = nonce;
  }

  return jwt.sign(payload, keys.sign[config.idToken.signKid], options);
}

function createToken(scope, user, clientId, done) {
  var tok = {
    token: makeHash(config.token.length),
    expiresIn: config.token.expiresIn,
    scope: scope,
    user: user,
    clientId: clientId,
  };

  tokens.save(tok, done);
}

function issueToken(client, user, ares, done) {
  createToken(ares.scope, user, client.clientId, function(err, token) {
    if(err) { return done(err); }

    done(null, token.token, {expires_in: token.expiresIn});
  });
}

function issueIdToken(client, user, ares, done) {
  done(null, createIdToken(client.clientId, user.id, ares.nonce));
}

function issueCode(client, redirectUri, user, ares, done) {
  var c = {
    code: makeHash(config.code.length),
    expiresIn: config.code.expiresIn,
    scope: ares.scope,
    nonce: ares.nonce,
    user: user,
    clientId: client.clientId,
    redirectUri: redirectUri
  };

  codes.save(c, function(err, code) {
    if(err) { return done(err); }

    done(null, code.code);
  });
}

function issueTokenFromCode(client, code, redirectUri, done) {
  codes.lookup(code, function(err, code) {
    if(err) { return done(err); }

    if(code.isRedeemed()) {
      return done(new TokenError('Code already redeemed',
                                 'invalid_request'));
    }
    if(code.isExpired()) {
      return done(new TokenError('Code expired', 'invalid_request'));
    }
    if(!code.matchesClientId(client.clientId)) {
      return done(new TokenError('Client ID does not match orignal request',
                                 'invalid_client'));
    }
    if(!code.matchesRedirectUri(redirectUri)) {
      return done(new TokenError('Redirect URI does not match orignal request',
                                 'invalid_request'));
    }

    code.redeem();

    createToken(code.scope, code.user, code.clientId, function(err, token) {
      var extras = {
        expires_in: token.expiresIn
      };

      if(code.scope.indexOf('openid') != -1) {
        extras['id_token'] = createIdToken(code.clientId, code.user.id,
          code.nonce);
      }

      done(null, token.token, extras);
    });
  });
};

module.exports.issueToken = issueToken;
module.exports.issueCode = issueCode;
module.exports.issueTokenFromCode = issueTokenFromCode;
module.exports.issueIdToken = issueIdToken;
