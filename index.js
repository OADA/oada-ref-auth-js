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

var path = require('path');
var https = require('https');

var express = require('express');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');
var morgan = require('morgan');
var oauth2orize = require('oauth2orize');

var oadaError = require('oada-error').middleware;
var oadaLookup = require('oada-lookup');
var clientDiscovery = require('oada-client-discovery');
var wkj = require('well-known-json')();

var config = require('./config');
var clients = require(config.datastores.clients);
var keys = require('./keys');
var utils = require('./utils');
require('./auth');

var app = express();

app.set('view engine', 'ejs');
app.set('json spaces', config.server.jsonSpaces);
app.set('views', path.join(__dirname, 'views'));

app.use(morgan('combined'));
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
  secret: config.server.sessionSecret,
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

var server = oauth2orize.createServer();
server.serializeClient(function(client, done) {
  return done(null, client.clientId);
});
server.deserializeClient(function(id, done) {
  oadaLookup.clientRegistration(id, done);
});

//////
// UI
//////
if (config.oauth2.enable || config.oidc.enable) {
  var oauth2 = require('./oauth2')(server);

  app.get(config.endpoints.authorize, oauth2.authorize);
  app.post(config.endpoints.decision, oauth2.decision);
  app.post(config.endpoints.token, oauth2.token);

  app.get(config.endpoints.login, function(req, res) {
    res.render('login');
  });

  app.post(config.endpoints.login, passport.authenticate('local', {
    successReturnToOrRedirect: '/',
    failureRedirect: config.endpoints.login,
  }));

  app.get(config.endpoints.logout, function(req, res) {
    req.logout();
    res.redirect(req.get('Referrer'));
  });

  app.use(express.static(path.join(__dirname, 'public')));
}

//////
// OAuth 2.0
//////
if (config.oauth2.enable) {
  wkj.addResource('oada-configuration', {
    'authorization_endpoint': './' + config.endpoints.authorize,
    'token_endpoint': './' + config.endpoints.token,
    'oada_base_uri': config.server.root,
    'client_secret_alg_supported': [
      'RS256',
    ],
  });
}

//////
// OIDC
//////
if (config.oidc.enable) {
  require('./oidc')(server);

  app.get(config.endpoints.certs, require('cors')(), function(req, res) {
    res.json(keys.jwks);
  });

  app.get(config.endpoints.userinfo, require('cors')(),
      passport.authenticate('bearer', {session:false}),
      function(req, res) {

    var userinfo = utils.createUserinfo(req.user, req.authInfo.scope);

    if (userinfo.sub !== undefined) {
      res.json(userinfo);
    } else {
      res.status(401).end('Unauthorized');
    }
  });

  wkj.addResource('openid-configuration', {
    'issuer': config.server.root,
    'authorization_endpoint': './' + config.endpoints.authorize,
    'token_endpoint': './' + config.endpoints.token,
    'userinfo_endpoint': './' + config.endpoints.userinfo,
    'jwks_uri': './' + config.endpoints.certs,
    'response_types_supported': [
      'code',
      'token',
      'id_token',
      'code token',
      'code id_token',
      'id_token token',
      'code id_token token'
    ],
    'subject_types_supported': [
      'public'
    ],
    'id_token_alg_values_supported': [
      'RS256'
    ],
    'token_endpoint_auth_methods_supported': [
      'client_secret_post'
    ]
  });
}

/////
// Client Discovery
/////
if (config.clientDiscovery.enable) {
  app.get(config.endpoints.clientDiscovery, clientDiscovery(clients.lookup));
  wkj.addResource('oada-client-discovery', {
    'client_discovery': './' + config.endpoints.clientDiscovery,
  });
}

/////
// .well-known
/////
app.use(wkj);

/////
// Standard OADA Error
/////
app.use(oadaError());

if (config.server.httpMode) {
  var server = app.listen(process.env.PORT || config.server.port, function() {
    console.log('Listening HTTP on port %d', server.address().port);
  });
} else {
  var server = https.createServer(config.certs, app);
  server.listen(process.env.PORT || config.server.port, function() {
    console.log('Listening HTTPS on port %d', server.address().port);
  });
}
