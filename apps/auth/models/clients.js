var mongoose     = require('../common/db/mongoose');
var ClientSchema = require('../common/db/client-schema');
var log          = require('common/log').child ({ module : 'models/client' });
var emitter      = mongoose.emitter;
var uuid         = require('uuid');

var db;
emitter.on ('heimdallr.mongo.connected', function () {
	db = mongoose.db;
});

var model = {};

model.add_client = function (params, callback) {

	if (!db) {
		log.error ('MongoDB Connection error: Unable to generate authorization code');
		return callback (new Error('MongoDB Connection error'), null);
	}

	/* db connected */
	var Client = db.conn.model('ClientCredential', ClientSchema);

	var client = new Client ({
		app_type          : params.type,
		display_name      : params.display_name,
		cid               : params.client_id,
		secret            : params.client_secret,
		callback_url      : params.callback_url,
		grant_type        : params.grant_type,
		response_type     : params.grant_type,
		scope             : params.scope,
		logo_uri          : params.logo_uri,
		contact           : params.contact,
		sso_req           : params.sso_req,
		trusted           : params.trusted_client,
	});

	Client.findOne ( { 'display_name' : client.display_name }, function (err, _client) {

		if (err)
			return callback (err, null);

		if (_client)
			return callback (new Error ('EALREADY_EXISTS'), _client);

		client.save (function (err) {
			if (err) {
				return callback (err, null);
			}
			return callback (null, client);
		});
	});
};

model.update_client = function (cid, params, callback) {

	if (!db)
		return callback (new Error('MongoDB Connection error'), null);

	/* db connected */
	var Client = db.conn.model('ClientCredential', ClientSchema);

	var update = {
		display_name      : params.display_name,
		callback_url      : params.callback_url,
		logo_uri          : params.logo_uri,
		contact           : params.contact,
		sso_req           : params.sso_req,
		trusted           : params.trusted,
	};

	/*
	 * Remove null keys
	 */
	Object.keys (update).forEach (function (curr) {
		if (!update[curr])
			delete update[curr];
	});

	Client.findOneAndUpdate ({ cid : cid }, update, { new : true }, function (err, raw) {
		if (err) {
			return callback (err, null);
		}

		if (!raw) {
			return callback (new Error ('no such cid'), null);
		}
		return callback (null, raw);
	});
};

model.delete_client = function (cid, callback) {

	if (!db)
		return callback (new Error('MongoDB Connection error'), null);

	/* db connected */
	var Client = db.conn.model('ClientCredential', ClientSchema);

	Client.remove ({ cid : cid }, function (err, raw) {
		if (err) {
			return callback (err, null);
		}

		return callback (null, raw);
	});
};

model.get = function (what, val, cb) {

	if (!db) {
		log.error ('MongoDB Connection error: Unable to generate authorization code');
		return callback (new Error('MongoDB Connection error'), null);
	}

	var Client = db.conn.model('clientcredential', ClientSchema);

	var __query = {};
	if (what)
		__query[what] = val;

	Client.findOne (__query, function (err, _client) {
		if (err)
			return cb (err, null);

		if (!_client)
			return cb ('no such client', null);

		return cb(null, _client);
	});

};

model.get_multiple = function (what, val, cb) {

	if (!db) {
		log.error ('MongoDB Connection error: Unable to generate authorization code');
		return callback (new Error('MongoDB Connection error'), null);
	}

	var Client = db.conn.model('clientcredential', ClientSchema);

	var __query = {};
	if (what)
		__query[what] = val;

	Client.find (__query, function (err, _client) {
		if (err)
			return cb (err, null);

		if (!_client || !_client.length)
			return cb ('no such client', null);

		return cb(null, _client);
	});

};

model.delete = function (id, callback ) {

};

module.exports = model;
