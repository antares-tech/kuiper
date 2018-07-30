var mongoose            = require('../common/db/mongoose');
var AuthorizationSchema = require('../common/db/authcode-schema');
var log                 = require('common/log').child ({ module : 'auth-code' });
var emitter             = mongoose.emitter;
var uuid                = require('uuid');

var db;
emitter.on ('heimdallr.mongo.connected', function () {
	db = mongoose.db;
});

var model = {};

model.save = function (params, callback) {

	if (!db) {
		/* implement custom error */
		log.error ('MongoDB Connection error: Unable to generate authorization code');
		return callback (new Error('MongoDB Connection error'), null);
	}

	var AuthorizationCode = db.conn.model('AuthorizationCode', AuthorizationSchema);

	var code = new AuthorizationCode ({
		uid          : params.uuid,
		client_id    : params.client_id,
		redirect_uri : params.redirect_uri,
		scope        : params.scope,
	});
	
	AuthorizationCode.findOne ( { 'uid' : code.uid }, function (err, _code) {

		if (err) {
			log.error ('Error in finding authorization code', {id : code.uid} );
			return callback (new Error('Error in finding authorization code'), null);
		}

		if (_code) {
			log.info ('Already there', {id : code.uid});
			return callback (new Error('Code already exists'), null);
		}

		code.save (function (err) {
			if (err) {
				log.error('Authorization_code add error with id', code.uid);
				return callback (new Error('add error'), null);
			}

			log.info ('Authorization Code added successfully', {id : code.uid});
			return callback (null, code.uid);
		});
	});

};

model.delete = function (id, callback ) {

};

module.exports = model;
