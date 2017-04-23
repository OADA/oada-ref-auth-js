const Database  = require('arangojs').Database;
const config = require('../../config');
const moment = require('moment');
const _ = require('lodash');
const expect = require('chai').expect;

const userdocs = require('./users.json');
const clientdocs = require('./clients.json');
const tokendocs = require('./tokens.json');
const codedocs = require('./codes.json');

// Tests for the arangodb driver:

let db;
let dbname;
let cols = {};
describe('arangodb tests', () => {
  before(() => {
    // Create the test database:
    dbname = 'oada-ref-auth:arangotest-'+moment().format('YYYY-MM-DD_HH:mm:ss');
    db = new Database(config.get('arangodb:connectionString'));
    config.set('arango:database',dbname);
    return db.createDatabase(dbname)
    .then(() => {
      db.useDatabase(dbname);

      // Create collections for users, clients, tokens, etc.
      return Promise.props(_.mapValues(config.get('arango:collections'), (val,key) => {
        cols[key] = db.collection(colname);
        return cols[key].create();
      }));
    }).then(cols => {
      return Promise.props({
          users: cols.users.createHashIndex('username', { unique: true, sparse: true }),
        clients: cols.users.createHashIndex('clientId', { unique: true, sparse: true }),
         tokens: cols.users.createHashIndex('token',    { unique: true, sparse: true }),
          codes: cols.users.createHashIndex('code',     { unique: true, sparse: true }),
      });
    }).then(cols => {
      console.log('Successfully created collections, inserting test values');
      return Promise.props({
          users: Promise.all(_.map(  userdocs, u => cols.users.save(u)  )),
        clients: Promise.all(_.map(clientdocs, c => cols.clients.save(c))),
         tokens: Promise.all(_.map( tokendocs, t => cols.tokens.save(t) )),
          codes: Promise.all(_.map(  codedocs, c => cols.codes.save(c)  )),
      });
    }).catch(err => {
      console.log('FAILED to initialize arango tests by creating database '+dbname);
      console.log('The error = ', err);
    });
  });


  it('should have the first test', () => {
    expect(true).to.equal(false);
  });



  after(() => {
    return db.dropDatabase(dbame)
    .then(() => { console.log('Successfully cleaned up test database '+dbname); })
    .catch(err => console.log('Could not drop test database '+dbname+' after the tests!'));
  });

});
