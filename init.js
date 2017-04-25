// This file handles running the config.get("init") function whenever you 
// call `npm run init`.  It's intended to be used to ensure your database
// exists, has proper indexes, and has any required or initial data in it.
// 
// Be sure to write your init function such that it doesn't wipe out
// your entire database if it gets run over and over again.  That way
// it will work as a default script to run on every startup.

const config = require('./config');

const init = config.get('init');
if (typeof init !== 'function') return console.log('init: no intialization function available');

console.log('init: initializing');
init(config);

