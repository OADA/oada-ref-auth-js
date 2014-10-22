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

var clients = {
  "3klaxu838akahf38acucaix73@identity.oada-dev.com": {
    "clientId": "3klaxu838akahf38acucaix73@identity.oada-dev.com",
    "name": "OADA Reference Implementation",
    "redirectUrls": [
      "http://client.oada-dev.com/redirect",
      "http://client.oada-dev.com/redirect.html",
    ],
    "licenses": [
      "OADA"
    ],
    "puc": "https://identity.oada-dev.com/puc.html",
    "keys": [{
      "kty": "RSA",
      "use": "sig",
      "alg": "RS256",
      "kid": "nc63dhaSdd82w32udx6v",
      "n": "AKj8uuRIHMaq-EJVf2d1QoB1DSvFvYQ3Xa1gvVxaXgxDiF9-Dh7bO5f0VotrYD05MqvY9X_zxF_ioceCh3_rwjNFVRxNnnIfGx8ooOO-1f4SZkHE-mbhFOe0WFXJqt5PPSL5ZRYbmZKGUrQWvRRy_KwBHZDzD51b0-rCjlqiFh6N",
      "e": "AQAB"
    }]
  }
}

module.exports.lookup = function(id, cb) {
  if(clients[id]) {
    cb(null, clients[id]);
  } else {
    cb(null);
  }
};
