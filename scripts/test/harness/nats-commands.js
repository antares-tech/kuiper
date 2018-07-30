var moment   = require ('moment');
var minimist = require ('minimist');
var promise  = require ('bluebird');
var colors   = require ('colors');
var store    = require ('common/store');
var protocol = require ('common/protocol');
var nats_if  = require ('common/nats-if');
var utils    = require ('./utils');

var NAT = {};
var argv = minimist (process.argv.slice(2));

NAT.init = async function (options, args) {
	var _d = promise.pending ();

	try {
		await nats_if.init ();

		_d.resolve ({
			request        : null,
			response       : null,
			return_value   : false,
			callback_event : null,
		});
	}
	catch (e) {
		_d.reject (e);
	}

	return _d.promise;
};

NAT.who_has = async function (options, args) {
	var _d = promise.pending ();
	var group    = args && args.group;
	var from     = args && args.from ;

	try {
		if (!group)
			throw 'need argument "group"';
		if (!from)
			throw 'need argument "from"';

		/*
		 * Create the PDU */
		var msg = new protocol ({
			header : {
				id:     'WHO-HAS',
				to:     "*=usher",
				from:   from,
				type:   'req'
			},
			payload : {
				group : group
			}
		});

		var _r        = await nats_if.request ('CH-BCAST-TO-USHERS', msg, {}, 5000);

		_d.resolve ({
			request        : msg,
			response       : _r,
			return_value   : true,
			callback_event : null,
			transport      : 'nats'
		});
	}
	catch (e) {
		_d.reject (e);
	}

	return _d.promise;
};

NAT.i_am_available = async function (options, args) {
	var _d = promise.pending ();
	var group = args && args.group;
	var from  = args && args.from;
	var channel  = args && args.channel;

	try {
		if (!group)
			throw 'need argument "group"';
		if (!from)
			throw 'need argument "from"';
		if (!channel)
			throw 'need argument "channel"';

		/*
		 * Create the PDU */
		var msg = new protocol ({
			header : {
				id:     'I-AM-AVAILABLE',
				to:     "*=usher",
				from:   from,
				type:   'req'
			},
			payload : {
				group : group
			}
		});

		var _r        = await nats_if.request (channel, msg, {}, 5000);

		_d.resolve ({
			request        : msg,
			response       : _r,
			return_value   : true,
			callback_event : null,
			transport      : 'nats'
		});
	}
	catch (e) {
		_d.reject (e);
	}

	return _d.promise;
};

NAT.ack = async function (options, args) {
	var _d           = promise.pending ();
	var trigger_data = options.trigger_data;
	var msg          = trigger_data && trigger_data.msg
	var reply_to     = trigger_data && trigger_data.reply_to;

	try {
		if (!trigger_data)
			throw 'need trigger_data for event driven callbacks';

		if (!args.status)
			throw 'need argument "status"';

		if (args.status !== 'ok' && args.status !== 'not-ok')
			throw `invalid value of status = "${args.status}"`;

		/*
		 * Create the PDU */
		var status = args.status == 'ok' ? true : false;

		if (!status && !args.reason)
			throw 'need argument "reason"';

		if (status)
			msg.make_ack (status, null, {});
		else
			msg.make_ack (status, args.reason, null);

		nats_if.reply (reply_to, msg);

		_d.resolve ({
			request        : null,
			response       : msg,
			return_value   : false,
			callback_event : null,
			transport      : 'nats'
		});
	}
	catch (e) {
		_d.reject (e);
	}

	return _d.promise;
};

NAT.provide_unicast_channel = async function (options, args) {
	var _d = promise.pending ();
	var trigger_data = options.trigger_data;
	var msg = trigger_data && trigger_data.msg
	var reply_to = trigger_data && trigger_data.reply_to;

	try {
		if (!trigger_data)
			throw 'need trigger_data for event driven callbacks';

		if (msg.id !== 'PROVIDE-UNICAST-CHANNEL')
			throw 'callback triggered for incorrent message : ' + msg.id;

		if (!args.channel)
			throw 'need argument "channel"';
		/*
		 * Create the PDU */
		msg.make_ack (true, null, {
			channel : args.channel
		});

		nats_if.reply (reply_to, msg);

		_d.resolve ({
			request        : null,
			response       : msg,
			return_value   : false,
			callback_event : null,
			transport      : 'nats'
		});
	}
	catch (e) {
		_d.reject (e);
	}

	return _d.promise;
};

NAT.enqueue_call = async function (options, args) {
	var _d = promise.pending ();
	var group = args && args.group;
	var from  = args && args.from;
	var channel  = args && args.channel;

	try {
		if (!group)
			throw 'need argument "group"';
		if (!from)
			throw 'need argument "from"';
		if (!channel)
			throw 'need argument "channel"';

		/*
		 * Create the PDU */
		var msg = new protocol ({
			header : {
				id:     'ENQUEUE-CALL',
				to:     "*=usher",
				from:   from,
				type:   'req'
			},
			payload : {
				group : group,
				enqueue_ts : moment ().toISOString()
			}
		});

		var _r        = await nats_if.request (channel, msg, {}, 5000);

		_d.resolve ({
			request        : msg,
			response       : _r,
			return_value   : true,
			callback_event : null,
			transport      : 'nats'
		});
	}
	catch (e) {
		_d.reject (e);
	}

	return _d.promise;
};

NAT.open = async function (options, args) {
	var _d = promise.pending ();
	var channel  = args && args.channel;

	try {
		if (!channel)
			throw 'need argument "channel"';

		nats_if.open_channel (channel, function (_channel, msg, reply_to) {
			var orig_msg = new protocol (msg.toObject ());

			if (!inform_vm (_channel, msg, reply_to)) {
				console.log (colors.red ('** warning : stray incoming message **'));
				utils.print_pdu (orig_msg, 'in', 'nats');
			}
		});

		_d.resolve ({
			response       : null,
			return_value   : false,
			callback_event : null,
			transport      : 'nats'
		});
	}
	catch (e) {
		_d.reject (e);
	}

	return _d.promise;
};

function inform_vm (channel, msg, reply_to) {
	var __msg = msg.toObject ();
	var matched = false;

	for (var key in event_keys) {

		var args    = event_keys[key].args;
		var emitter = event_keys[key].emitter;

		if (criteria_match (args, channel, __msg, reply_to)) {

			if (argv['show-on-message-match'])
				console.log (colors.dim (`match ok ${key}`))

			console.log (colors.yellow ('>>>> incoming message'));
			utils.print_pdu (msg, 'in', 'nats');

			emitter.emit (key, {
				msg     : msg,
				channel : channel,
				reply_to: reply_to
			});

			matched = true;
			continue;
		}

		if (argv['show-on-message-match'])
			console.log (colors.dim (`match failed ${key}`))
	}

	return matched;
}

function criteria_match (args, channel, __msg, reply_to) {
	var unchecked = Object.keys (args).length;
	var match = false;

	for (var arg in args) {
		var value_to_check = args[arg];

		match = false;

		switch (arg) {

			case 'nats':
				match = true;
				unchecked --;
				break;

			case 'channel':
				if (value_to_check == channel) {
					match = true;
					unchecked --;
				}
				break;

			case 'msg-id':
				if (value_to_check == __msg.header.id) {
					match = true;
					unchecked --;
				}
				break;

			case 'to':
				if (value_to_check == __msg.header.to) {
					match = true;
					unchecked --;
				}
				break;

			case 'from':
				if (value_to_check == __msg.header.from) {
					match = true;
					unchecked --;
				}
				break;

			default:
				break;
		}

		if (argv['show-on-message-match'])
			console.log (colors.dim (`${arg} === ${value_to_check} ${match ? "matched" : "not matched"}`));
	}

	return unchecked ? false : true;
}

var event_keys = {};
NAT.on_message = async function (options, args) {
	var _d = promise.pending ();
	var key = 'on-message%%';
	var emitter = options.emitter;

	/* Create a simple hash from the argumets */
	for (var prop in args)
		key += `${prop}%${args[prop]}`;

	event_keys [ key ] = {
		args    : args,
		emitter : emitter
	};

	try {
		_d.resolve ({
			response       : null,
			return_value   : false,
			callback_event : key,
			transport      : 'nats'
		});
	}
	catch (e) {
		_d.reject (e);
	}

	return _d.promise;
};

module.exports = NAT;
