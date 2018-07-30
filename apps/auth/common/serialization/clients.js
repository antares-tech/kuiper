var log = require('common/log').child ({ module : 'server-serialization' });

var serialization = {};

serialization.serializer = function (client, done) {
	log.debug ({client : client}, 'serialize client');
	var trusted_client = client.trusted ? 'trusted' : 'untrusted';
	done (null, trusted_client + '@' + client.id + '@' + client.d);
};

serialization.deserializer = function (id, done) {
	log.debug ({id : id}, 'deserialize client');

	var _s = id.split('@');

	var client = {
		trusted : _s[0],
		id      : _s[1],
		d       : _s[2],
	};

	done (null, client);
};

module.exports = serialization;
