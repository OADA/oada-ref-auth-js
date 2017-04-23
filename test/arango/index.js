const Database  = require('arangojs').Database;
const config = require('../../config');
const moment = require('moment');
const _ = require('lodash');
const expect = require('chai').expect;
const Promise = require('bluebird');
const bcrypt = require('bcrypt');

const userdocs = require('./users.json');
const clientdocs = require('./clients.json');
const tokendocs = require('./tokens.json');
const codedocs = require('./codes.json');

// library under test:
let libs = {}; // pull this later after config sets the dbname it creates

// Tests for the arangodb driver:

let db;
let dbname;
let cols;
let colnames;
let frankid = null;
describe('arango driver', () => {
  before(() => {
    // Create the test database:
    db = new Database(config.get('arango:connectionString'));
    dbname = 'oada-ref-auth_arangotest-'+moment().format('YYYY-MM-DD-HH-mm-ss');
    config.set('arango:database',dbname);
    cols = config.get('arango:collections');
    colnames = _.values(cols);

    return db.createDatabase(dbname)
    .then(() => {
      db.useDatabase(dbname);

      // Create collections for users, clients, tokens, etc.
      return Promise.map(colnames, c => db.collection(c).create());
    }).then(() => { 

      // Create the indexes on each collection:
      return Promise.all([
        db.collection(cols.users)  .createHashIndex('username', { unique: true, sparse: true }),
        db.collection(cols.clients).createHashIndex('clientId', { unique: true, sparse: true }),
        db.collection(cols.tokens) .createHashIndex(   'token', { unique: true, sparse: true }),
        db.collection(cols.codes)  .createHashIndex(    'code', { unique: true, sparse: true }),
      ]);
    }).then(() => {
      // hash the password:
      const hashed = _.map(userdocs, u => {
        const r = _.cloneDeep(u);
        r.password = bcrypt.hashSync(r.password, config.get('server:passwordSalt'));
        return r;
      });
      // Save the demo documents in each collection:
      return Promise.props({
          users: Promise.all(_.map(    hashed, u => db.collection(cols.users)  .save(u))),
        clients: Promise.all(_.map(clientdocs, c => db.collection(cols.clients).save(c))),
         tokens: Promise.all(_.map( tokendocs, t => db.collection(cols.tokens) .save(t))),
          codes: Promise.all(_.map(  codedocs, c => db.collection(cols.codes)  .save(c))),
      });
    }).then(() => {
      // get Frank's id for test later:
      return db.collection('users').firstExample({username: 'frank'}).then(f => frankid = f._key);
    // Done!
    }).then(() => {
      libs = {
          users: require('../../db/arango/users'),
        clients: require('../../db/arango/clients'),
         tokens: require('../../db/arango/tokens'),
          codes: require('../../db/arango/codes'),
      };

    }).catch(err => {
      console.log('FAILED to initialize arango tests by creating database '+dbname);
      console.log('The error = ', err);
    });
  });


  //--------------------------------------------------
  // The tests!
  //--------------------------------------------------

  describe('.users', () => {
    it('should be able to find frank by his id', done => {
      libs.users.findById(frankid, (err,u) => {
        expect(err).to.be.a('null');
        expect(u.username).to.equal('frank');
        done();
      });
    });
    it('should be able to find frank with his password', done => {
      libs.users.findByUsernamePassword('frank', 'test', (err,u) => {
        expect(err).to.be.a('null');
        expect(u.username).to.equal('frank');
        done();
      });
    });
  });

  describe('.clients', () => {
    it('should be able to find the initial test client', done => {
      const clientId = '3klaxu838akahf38acucaix73@identity.oada-dev.com';
      libs.clients.findById(clientId, (err,c) => {
        expect(err).to.be.a('null');
        expect(c.clientId).to.equal(clientId);
        done();
      });
    });

    it('should be able to successfully save a new client', done => {
      const newclient = _.cloneDeep(clientdocs[0]);
      newclient.clientId = '12345abcd';
      libs.clients.save(newclient, (err,c) => {
        expect(err).to.be.a('null');
        expect(c.clientId).to.equal(newclient.clientId);
        done();
      });
    });
  });

  describe('.codes', () => {
    it('should be able to find the initial test code', done => {
      libs.codes.findByCode('xyz', (err,c) => {
        expect(err).to.be.a('null');
        expect(c.code).to.equal('xyz');
        done();
      });
    });

    it('should be able to successfully save a new code', done => {
      const newcode = _.cloneDeep(codedocs[0]);
      newcode.code = '012345abcd';
      newcode.user = { _id: frankid};
      libs.codes.save(newcode, (err,c) => {
        expect(err).to.be.a('null');
        expect(c.code).to.equal(newcode.code);
        done();
      });
    });
  });


  describe('.tokens', () => {
    it('should be able to find the initial test token', done => {
      libs.tokens.findByToken('xyz', (err,t) => {
        expect(err).to.be.a('null');
        expect(t.token).to.equal('xyz');
        done();
      });
    });

    it('should be able to successfully save a new token', done => {
      const newtoken = _.cloneDeep(tokendocs[0]);
      newtoken.token = '012345abcd';
      newtoken.user = { _id: frankid};
      libs.tokens.save(newtoken, (err,t) => {
        expect(err).to.be.a('null');
        expect(t.token).to.equal(newtoken.token);
        done();
      });
    });
  });




  //-------------------------------------------------------
  // After tests are done, get rid of our temp database
  //-------------------------------------------------------

  after(() => {
    db.useDatabase('_system'); // arango only lets you drop a database from the _system db
    return db.dropDatabase(dbname)
    .then(() => { console.log('Successfully cleaned up test database '+dbname); })
    .catch(err => console.log('Could not drop test database '+dbname+' after the tests! err = ', err));
  });

});
