var promise = require('bluebird');
var ioredis = require('ioredis');

/*
 * Set the default expiry to 1 day
 */
var default_expiry = 1 * 24 * 60 * 60;

class Cache {
	constructor(options) {
		this.expiry    = options && options.expiry || default_expiry;
		this.namespace = options && options.namespace;

		/*
		 * Connect to REDIS
		 */
		this._init ();
	}

	_init () {
		/*
		 * Connect to REDIS
		 */
		this.redis = new ioredis({
			retryStrategy : function (times) { return Math.min(times * 1000, 10000); },
			keyPrefix     : this.namespace,
		});

		this.redis.on('connect', function () {
		});

		this.redis.on('error', function (err) {
			console.log ({ err }, 'redis connection error');
		});

		this.redis.on('close', function () {
			console.log ('redis connection closed');
		});
		this.redis.on('reconnecting', function () {
			console.log ('redis reconnecting ...');
		});
	}

	_set (key, val) {
		return this.redis.set (key, val, 'EX', this.expiry);
	}

	_get (key) {
		return this.redis.get (key);
	}

	_del (key) {
		return this.redis.del (key);
	}

	_flush_all () {
		this.redis.flushall ();
	}
};

module.exports = Cache;
