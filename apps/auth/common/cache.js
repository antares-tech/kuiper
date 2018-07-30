var redis        = require( 'redis' );
var log          = require('common/log').child ({ module : 'redis-client' });

var cache = {};
cache.connected = false;

var _redis = redis.createClient();
_redis.on ( 'error', function (err) {
	log.error ({ error : err }, 'Connection error redis-server');
	process.exit (1);
});

_redis.on ( 'disconnected', function () {
	log.warn ('disconnected redis-server');
});

_redis.on ( 'connect', function () {
	log.info ('connecting to redis-server...');
});

_redis.on ('reconnecting', function () {
	log.info ('reconnecting redis-server ...');
});

_redis.on ( 'ready', function () {
	cache.connected = true;
	log.info ('connection to redis-server ready');
});

cache.init = function (namespace, expire) {
	return { 
		set : function (key, value) {
			if (!cache.connected) {
				log.warn ('cache: set key failed. Not connected to Redis.');
				return;
			}

			key = namespace + '->' + key;

			log.debug ('cache (' + key + ') set');
			_redis.set (key, value);
			_redis.expire (key, expire);
		},
		get : function (key, cb) {
			if (!cache.connected) {
				log.warn ('cache: get key failed. Not connected to Redis.');
				cb('not connected', null);
				return;
			}

			key = namespace + '->' + key;
			_redis.get(key, cb);
		},
		invalidate : function (key) {
			key = namespace + '->' + key;
			log.debug ('cache:invalidating key: ' + key);
			_redis.del(key);
		}
	};
};

module.exports = cache;
