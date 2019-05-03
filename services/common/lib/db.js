var promise  = require ('bluebird');
var mongoose = require ('mongoose');
var events   = require ('events');
var log      = require ('common/log').child({ module : 'common/lib/db' });
var store    = require ('common/store');

var emitter = new events.EventEmitter();
var db;

function init (url, options) {
	var _d = promise.pending();

	db = mongoose.createConnection (
		url,
		{ 
			server : { 
				pool : 5,
				auto_reconnect : true
			}
		},
		function (err) {
			if (err) {
				log.error ({ url : url, err : err }, 'db connect failed');
				process.exit (1);
			}

			log.trace ({ url:url }, 'db connected ok');
			emitter.emit ('db-connected');
			_d.resolve (db);
		});

	db.on ('disconnected', () => { log.warn ({ url : url }, 'db disconnected'); });
	db.on ('connected', () => { log.info ({ url : url }, 'db connected'); });

	return _d.promise;
}

function close () {
	var _d = promise.pending();

	db.close(function (err) {

		if (err) {
			log.error ({ err:err }, 'db close error');
			return _d.reject (err);
		}

		log.trace ('db close ok');
		_d.resolve ();
	});

	return _d.promise;
}

function get_db () {
	return db;
}

module.exports = { db: get_db, init : init, emitter : emitter, close : close };
