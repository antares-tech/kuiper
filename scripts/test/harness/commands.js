var promise= require ('bluebird');
var nats   = require ('./nats-commands');
var utils  = require ('./utils');
var print  = require ('./print');
var sock   = require ('./socket');
var demux  = require ('./demux');
var rest   = require ('./rest');

var commands = {
	/*
	 * Commands on the NATS.io transport */
	'NATS-INIT'               : nats.init,
	'ACK'                     : nats.ack,
	'WHO-HAS'                 : nats.who_has,
	'I-AM-AVAILABLE'          : nats.i_am_available,
	'ENQUEUE-CALL'            : nats.enqueue_call, 
	'PROVIDE-UNICAST-CHANNEL' : nats.provide_unicast_channel, 
	'OPEN'                    : nats.open, 

	/*
	 * Command de-mux */
	'ON-MESSAGE'              : demux.on_message, 
	'ACK'                     : demux.ack,

	/*
	 * Utilites */
	'PRINT'                   : print.print,
	'ASSERT'                  : utils.assert,
	'SLEEP'                   : utils.sleep,
	'WAIT-FOR-EXIT'           : utils.wait_for_exit,
	'EXIT'                    : utils.exit,

	/*
	 * Socket commands */
	'CONNECT'                 : sock.connect,
	'DISCONNECT'              : sock.disconnect,
	'AUTHENTICATE'            : sock.authenticate,
	'WHOS-MY-USHER'           : sock.whos_my_usher,
	'AGENT-AVAILABLE'         : sock.agent_available,
	'ACCEPT-CALL'             : sock.accept_call,
	'REJECT-CALL'             : sock.reject_call,
	'END-CALL'                : sock.end_call,
	'CALL'                    : sock.call,

	/*
	 * REST commands */
	'REST-INIT'               : rest.init, 
	'REST-GET'                : rest.get, 
};

module.exports = function (__command, options, args) {

	if (!commands[__command])
		throw "unknown command";

	if (!args.delay)
		return commands[__command] (options, args);

	var _d = promise.pending ();

	setTimeout (async () => {
		try {
			var response = await commands[__command] (options, args);
			_d.resolve (response);
		}
		catch (e) {
			_d.reject (e);
		}
	}, args.delay);

	return _d.promise;
};
