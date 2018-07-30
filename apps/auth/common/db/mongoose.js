var mongoose     = require( 'mongoose' );
var log          = require( 'common/log' ).child ({ module : 'common/db/mongoose' });
var EventEmitter = require('events').EventEmitter;

var db_url = "mongodb://localhost:27017/heimdallr"; 
var connection = mongoose.createConnection (db_url);

var emitter = new EventEmitter ();

connection.on ( 'error', function (err) {
	log.error ({ error : err }, 'Connection error to mongodb');
	process.exit (1);
});

connection.on ( 'disconnected', function () {
	log.warn ('disconnected');
});

connection.on ( 'connected', function () {
	log.info ('connected');
});

connection.once ( 'open', function () {
	log.info ({ db_url : db_url }, 'connection OK');
	emitter.emit ("heimdallr.mongo.connected");
});

var db  = {};
db.conn = connection;

module.exports.db      = db;
module.exports.emitter = emitter;
