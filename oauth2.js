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

var URI = require('URIjs');
var login = require('connect-ensure-login');
var oauth2orize = require('oauth2orize');
var AuthorizationError = require('oauth2orize').AuthorizationError;
var passport = require('passport');

var oadaLookup = require('oada-lookup');

var utils = require('./utils');
var clients = require('./db/models/client');

var server;
module.exports = function(_server) {
  server = _server;

  // Implict flow (token)
  server.grant(oauth2orize.grant.token(utils.issueToken));

  // Code flow (code)
  server.grant(oauth2orize.grant.code(utils.issueCode));

  // Code flow exchange (code)
  server.exchange(oauth2orize.exchange.code(utils.issueTokenFromCode));

  //////
  // Middleware
  //////
  return {
    authorize: [
      login.ensureLoggedIn(),
      server.authorization(function(clientId, redirectURI, done) {
        clients.findById(clientId, function(err, client) {
          if (err) { return done(err); }
          if (!client) { return done('client_id does not exist'); }

          // Compare the given redirectUrl to all the clients redirectUrls
          for (var i = 0; i < client['redirect_uris'].length; i++) {
            if (URI(client['redirect_uris'][i]).equals(redirectURI)) {
              return done(null, client, redirectURI);
            }
          }
          done('Invalid redirect_url');
        });
      }),
      function(req, res) {
        oadaLookup.trustedCDP(function(err, pl) {
          res.render('approve', {
            transactionID: req.oauth2.transactionID,
            client: req.oauth2.client,
            scope: req.oauth2.req.scope,
            nonce: req.oauth2.req.nonce,
            trusted: req.oauth2.client.trusted,
          });
        });
      }
    ],
    decision: [
      login.ensureLoggedIn(),
      server.decision(function parseDecision(req, done) {

        var validScope = req.body.scope.every(function(el) {
          return (req.oauth2.req.scope.indexOf(el) != -1);
        });

        if (!validScope) {
          return done(new AuthorizationError('Scope does not match orignal ' +
              'request', 'invalid_scope'));
        }

        done(null, {
          allow: req.allow,
          scope: req.body.scope,
          nonce: req.oauth2.req.nonce,
        });
      }),
      server.errorHandler({mode: 'indirect'})
    ],
    token: [
      function(req, res, done) {
        // todo: hack to use passport-oauth2-client-password
        req.body['client_secret'] = req.body['client_assertion'];

        return done();
      },
      passport.authenticate(['oauth2-client-password'], {session: false}),
      server.token(),
      server.errorHandler({mode: 'direct'})
    ]
  };
};
