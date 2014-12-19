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

module.exports = function(code) {

  code.isValid = function() {
    if (typeof code.code !== 'string' ||
      !Array.isArray(code.scope) ||
      typeof code.user !== 'object' ||
      typeof code.clientId != 'string' ||
      typeof code.redirectUri != 'string') {
      return false;
    } else {
      return true;
    }
  };

  code.isExpired = function() {
    return (this.createTime + this.expiresIn > new Date().getTime());
  };

  code.matchesClientId = function(clientId) {
    return this.clientId === clientId;
  };

  code.matchesRedirectUri = function(redirectUri) {
    return URI(this.redirectUri).equals(redirectUri);
  };

  code.isRedeemed = function() {
    return this.redeemed;
  };

  code.redeem = function() {
    return (this.redeemed = true);
  };

  return code;
};
