var uuid          = require('uuid/v1');
var promise       = require('bluebird');
var NatsStream    = require('./nats-bunyan');
var store         = require('./store');

var name  = store.get('name');
var type  = store.get('type');
var level = store.get('log_level');

var natsStream = new NatsStream({
	cluster_name : '3a-cluster',
	client_name  : uuid (),
	subscription : `log.${type}.${name}.${process.pid}`
});

var p = promise.pending ();

natsStream.on('ready', () => {
	p.resolve (natsStream);
});

natsStream.on('error', (err) => {
	p.reject (err);
});

module.exports = {
	stream     : natsStream,
	promise    : p
};
