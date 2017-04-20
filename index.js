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
var URI = require('URIjs');

var oadaError = require('oada-error').middleware;
var oadaLookup = require('oada-lookup');

var config = require('./config');

module.exports = function(conf) {
  // TODO: This require config is very hacky. Reconsider.
  if (conf) {
    config.setObject(conf);
  }

  config.set('server:port', process.env.PORT || config.get('server:port'));

  // Add the prefix to the endpoints if there is one:
  var pfx = config.get('endpointsPrefix');
  if (pfx.length > 0) {
    var endpoints = config.get('endpoints');
    Object.keys(endpoints).forEach(function(k) { 
      config.set('endpoints:'+k, 
        (pfx+endpoints[k]).replace(/\/\//g,'') // fix any double slashes
      )
    });
  }

  var publicUri;
  if(!config.get('server:publicUri')) {
    publicUri = URI()
      .hostname(config.get('server:domain'))
      .port(config.get('server:port'))
      .protocol(config.get('server:mode'))
      .normalize()
      .toString();
  } else {
    publicUri = URI(config.get('server:publicUri'))
      .normalize()
      .toString();
  }

  config.set('server:publicUri', publicUri);

  // Require these late because they depend on the config
  var dynReg = require('./dynReg');
  var clients = require('./db/models/client');
  var keys = require('./keys');
  var utils = require('./utils');
  require('./auth');
  var app = express();

  var wkj = config.get('wkj') ? config.get('wkj') : require('well-known-json')();

  app.set('view engine', 'ejs');
  app.set('json spaces', config.get('server:jsonSpaces'));
  app.set('views', path.join(__dirname, 'views'));

  app.use(morgan('combined'));
  app.use(cookieParser());
  app.use(bodyParser.urlencoded({extended: true}));
  app.use(session({
    secret: config.get('server:sessionSecret'),
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
    clients.findById(id, done);
  });

  //////
  // UI
  //////
  if (config.get('oauth2:enable') || config.get('oidc:enable')) {
    var oauth2 = require('./oauth2')(server);

    app.options(config.get('endpoints:register'), require('cors')());
    app.post(config.get('endpoints:register'),
        require('cors')(), bodyParser.json(), dynReg);

    app.get(config.get('endpoints:authorize'), function(req, res, done) {
      res.header('X-Frame-Options', 'SAMEORIGIN');
      return done();
    }, oauth2.authorize);
    app.post(config.get('endpoints:decision'), oauth2.decision);
    app.post(config.get('endpoints:token'), oauth2.token);

    app.get(config.get('endpoints:login'), function(req, res) {
      res.header('X-Frame-Options', 'SAMEORIGIN');
      res.render('login', {
        hint: config.get('hint')
      });
    });

    app.post(config.get('endpoints:login'), passport.authenticate('local', {
      successReturnToOrRedirect: '/',
      failureRedirect: config.get('endpoints:login'),
    }));

    app.get(config.get('endpoints:logout'), function(req, res) {
      req.logout();
      res.redirect(req.get('Referrer'));
    });

    app.use(express.static(path.join(__dirname, 'public')));
  }

  //////
  // OAuth 2.0
  //////
  if (config.get('oauth2:enable')) {
    wkj.addResource('oada-configuration', {
      'authorization_endpoint': './' + config.get('endpoints:authorize'),
      'token_endpoint': './' + config.get('endpoints:token'),
      'registration_endpoint': './' + config.get('endpoints:register'),
      'token_endpoint_auth_signing_alg_values_supported': [
        'RS256',
      ],
    });
  }

  //////
  // OIDC
  //////
  if (config.get('oidc:enable')) {
    require('./oidc')(server);

    app.options(config.get('endpoints:certs'), require('cors')());
    app.get(config.get('endpoints:certs'), require('cors')(), function(req, res) {
      res.json(keys.jwks);
    });

    app.options(config.get('endpoints:userinfo'), require('cors')());
    app.get(config.get('endpoints:userinfo'), require('cors')(),
        passport.authenticate('bearer', {session:false}),
        function(req, res) {

      var userinfo = utils.createUserinfo(req.user, req.authInfo.scope);

      if (userinfo && userinfo.sub !== undefined) {
        res.json(userinfo);
      } else {
        res.status(401).end('Unauthorized');
      }
    });

    wkj.addResource('openid-configuration', {
      'issuer': config.get('server:publicUri'),
      'registration_endpoint': './' + config.get('endpoints:register'),
      'authorization_endpoint': './' + config.get('endpoints:authorize'),
      'token_endpoint': './' + config.get('endpoints:token'),
      'userinfo_endpoint': './' + config.get('endpoints:userinfo'),
      'jwks_uri': './' + config.get('endpoints:certs'),
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
      'id_token_signing_alg_values_supported': [
        'RS256'
      ],
      'token_endpoint_auth_methods_supported': [
        'client_secret_post'
      ]
    });
  }




  /////
  // .well-known
  /////
  if (!config.get('wkj')) {
    app.use(wkj);
  }

  /////
  // Standard OADA Error
  /////
  app.use(oadaError());

  return app;
}

if (require.main === module) {
  var app = module.exports();
  var server;
  if (config.get('server:mode') === 'http') {
    var server = app.listen(config.get('server:port'), function() {
      console.log('Listening HTTP on port %d', server.address().port);
    });
  } else {
    var server = https.createServer(config.get('certs'), app);
    server.listen(config.get('server:port'), function() {
      console.log('Listening HTTPS on port %d', server.address().port);
    });
  }
}
