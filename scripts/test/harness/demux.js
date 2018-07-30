var promise  = require ('bluebird');
var colors   = require ('colors');
var store    = require ('common/store');
var protocol = require ('common/protocol');
var nats     = require ('./nats-commands');
var sock     = require ('./socket');

var demux = {};
var prefix = '    ';

demux.on_message = async function (options, args) {
	var _d = promise.pending ();

	if (args.nats)
		return nats.on_message (options, args);

	if (args.socket)
		return sock.on_message (options, args);

	var err = 'unknown transport - expect either "nats" or "socket"';

	_d.reject (err);
	return _d.promise;
};

demux.ack = async function (options, args) {
	var _d = promise.pending ();

	if (args.nats)
		return nats.ack (options, args);

	if (args.socket)
		return sock.ack (options, args);

	var err = 'unknown transport - expect either "nats" or "socket"';

	_d.reject (err);
	return _d.promise;
};

module.exports = demux;
