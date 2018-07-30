var log               = require('common/log').child ({ module : 'user-serialization' });
var safeJsonStringify = require('safe-json-stringify');

var user_serialization = {};

user_serialization.serializer =  function (user, done) {

	log.debug ({user : user}, 'serialize user');

	done ( null, safeJsonStringify (user));
	
};

user_serialization.deserializer = function (serialized_user, done) {
	
	try {
		if (!serialized_user)
			throw new Error ('serialized_user is null');

		var json = JSON.parse (serialized_user);
		done (null, json);
	}
	catch (e) {
		log.error ({ err: e, stack : e.stack, serialized_user : serialized_user }, 'error in deserializer user');
		return done (e, null);
	}

};

module.exports = user_serialization;
