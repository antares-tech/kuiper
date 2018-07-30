var moment   = require ('moment');
var ws       = require ('ws');
var minimist = require ('minimist');
var promise  = require ('bluebird');
var colors   = require ('colors');
var store    = require ('common/store');
var protocol = require ('common/protocol');
var utils    = require ('./utils');

var SOCKET = {};
var argv = minimist (process.argv.slice(2));
var sock_map = {};
var tag_map = {};
var user_map = {};
var req_timeout = argv['sock-req-timeout'] || 2000;

SOCKET.connect = async function (options, args) {
	var _d        = promise.pending ();
	var host      = args && args.host;
	var port      = args && args.port;
	var node_id   = args && args['node-id'];
	var user_type = null;
	var node_type = null;
	var user_id   = args && args['user-id'];
	var group     = args && args.group;
	var path      = null;

	try {
		if (args && args.presence)
			node_type = 'presence';
		else if (args && args.lobby)
			node_type = 'lobby';

		if (!node_type)
			throw 'need argument "presence" or "lobby" : undefined node type';
		if (!host)
			throw 'need argument "host"';
		if (!port)
			throw 'need argument "port"';
		if (!node_id)
			throw 'need argument "node_id"';
		if (!user_id)
			throw 'need argument "user-id"';
		if (!group)
			throw 'need argument "group"';

		path = node_type === 'presence' ? 'agent' : 'caller';
		var sock = new ws (`ws://${host}:${port}/${path}`);

		sock_map [ user_id ] = {
			sock    : sock,
			tags    : {},
		};

		setTimeout (() => {
			if (!_d.promise.isFulfilled ())
				_d.reject ('timed out');
		}, req_timeout);

		sock.user_id = user_id;

		sock.on ('open', function () {
			var response = {
				sock        : sock,
				user_id     : user_id,
				user_type   : node_type === 'presence' ? 'agent' : 'caller',
				group       : group,
				node_id     : node_id,
				node_type   : node_type,
			};

			/*
			 * Add the user information to a map */
			var user_aep = `${user_id}=user,${node_id}=${node_type}`;
			user_map [ user_aep ] = response;

			_d.resolve ({
				request        : null,
				response       : response,
				return_value   : true,
				callback_event : null,
				transport      : 'socket'
			});
		});

		sock.on ('error', function (err) {
			if (sock.readyState === ws.CONNECTING)
				return _d.reject (err);

			/*
			 * Else the socket is open */
			var tags = sock_map [ sock.user_id ].tags;
			for (var tag in tags) {
				var pending = tag_map [ tag ];

				if (!pending)
					continue;

				pending.promise.reject (err);
				delete tag_map [ tag ];
			}

			delete sock_map [ sock.user_id ].tags;

			sock.terminate ();
		});

		sock.on ('message', function (message) {
			try {

				if (argv [ 'show-sock-incoming' ]) {
					console.log (colors.dim ('<< incoming on socket'));
					console.log (colors.dim (`${message}`));
				}

				var _msg = JSON.parse (message);
				var msg  = new protocol (_msg);

				if (msg.type === 'ok' || msg.type === 'not-ok')
					handle_ack (msg, sock);
				else
					handle_incoming (msg, sock);
			}
			catch (e) {
				var err = e;

				if (e instanceof Error)
					err = e.message;

				console.log (colors.red (`socket : in message error : ${err}`));
			}
		});

	}
	catch (e) {
		_d.reject (e);
	}

	return _d.promise;
};

SOCKET.disconnect = async function (options, args) {
	var _d = promise.pending ();
	var user = args && args.user;

	try {
		if (!user)
			throw 'need argument "user"';

		user.sock.close ();

		delete user_map [ user.user_aep ];

		_d.resolve ({
			request        : null,
			response       : null,
			return_value   : false,
			callback_event : null,
			transport      : 'socket'
		});
	}
	catch (e) {
		_d.reject (e);
	}

	return _d.promise;
};

function handle_ack (msg) {
	var tag = msg.tag;
	var pending = tag_map [ tag ]; 

	if (!pending ||  !pending.promise) {
		console.log (colors.red ('** stray ack/nack'));
		utils.print_pdu (msg, 'in', 'socket');
		return;
	}

	pending.promise.resolve (msg);
	delete tag_map [ tag ];
	delete sock_map [ pending.user_id ].tags [ tag ];
}

function handle_incoming (msg, sock) {
	var orig_msg = new protocol (msg.toObject ());

	if (!inform_vm (msg, sock)) {
		console.log (colors.red (`** warning : stray incoming message on socket (user_id = ${sock.user_id})**`));
		utils.print_pdu (orig_msg, 'in', 'socket');
	}
}

SOCKET.authenticate = async function (options, args) {
	var _d = promise.pending ();
	var user = args && args.user;
	var token = args && args.token;

	try {
		if (!user)
			throw 'need argument "user"';
		if (!token)
			throw 'need argument "token"';

		/*
		 * Create the PDU */
		var msg = new protocol ({
			header : {
				id:     'AUTHENTICATE',
				to:     `${user.node_id}=${user.node_type}`,
				from:   `${user.user_id}=user`,
				type:   'req'
			},
			payload : {
				group   : user.group,
				id      : user.user_id,
				token   : token
			}
		});

		var _r        = await request (user.sock, msg);

		/*
		 * Automatically set this for use in future commands */
		if (_r.type === 'ok') {
			user.aep = _r.payload.your_aep;
		}

		_d.resolve ({
			request        : msg,
			response       : _r,
			return_value   : true,
			callback_event : null,
			transport      : 'socket'
		});
	}
	catch (e) {
		_d.reject (e);
	}

	return _d.promise;
};

SOCKET.whos_my_usher = async function (options, args) {
	var _d = promise.pending ();
	var user = args && args.user;

	try {
		if (!user)
			throw 'need argument "user"';
		if (user.node_type !== 'presence')
			throw 'incorrect "user" type - does not appear to be an agent';

		/*
		 * Create the PDU */
		var msg = new protocol ({
			header : {
				id:     'WHOS-MY-USHER',
				to:     `${user.node_id}=${user.node_type}`,
				from:   `${user.aep}`,
				type:   'req'
			},
			payload : {
				group   : user.group,
			}
		});

		var _r        = await request (user.sock, msg);

		_d.resolve ({
			request        : msg,
			response       : _r,
			return_value   : true,
			callback_event : null,
			transport      : 'socket'
		});
	}
	catch (e) {
		_d.reject (e);
	}

	return _d.promise;
};

SOCKET.agent_available = async function (options, args) {
	var _d = promise.pending ();
	var user = args && args.user;

	try {
		if (!user)
			throw 'need argument "user"';
		if (user.node_type !== 'presence')
			throw 'incorrect "user" type - does not appear to be an agent';

		/*
		 * Create the PDU */
		var msg = new protocol ({
			header : {
				id:     'I-AM-AVAILABLE',
				to:     `${user.node_id}=${user.node_type}`,
				from:   `${user.aep}`,
				type:   'req'
			},
			payload : {
				group   : user.group,
			}
		});

		var _r        = await request (user.sock, msg);

		_d.resolve ({
			request        : msg,
			response       : _r,
			return_value   : true,
			callback_event : null,
			transport      : 'socket'
		});
	}
	catch (e) {
		_d.reject (e);
	}

	return _d.promise;
};

function request (sock, msg) {
	var _d = promise.pending ();

	sock.send (msg.toString (), { compress : false }, function (err) {

		if (err)
			return _d.reject (err);

		var tag = msg.tag;
		tag_map [ tag ] = {
			promise  : _d,
			user_id : sock.user_id
		};
		sock_map [ sock.user_id ].tags [ tag ] = true;
	});

	setTimeout (() => {
		/*
		 * If the timer times out, reject the promise */
		if (!tag_map [ msg.tag ])
			return;

		if (!tag_map [ msg.tag ].promise.promise.isFulfilled ()) {
			tag_map [ msg.tag ].promise.reject ('timed out');
			delete tag_map [ msg.tag ];
			delete sock_map [ sock.user_id ].tags [ msg.tag ];
		}

	}, req_timeout);

	return _d.promise;
}

function inform_vm (msg, sock) {
	var __msg = msg.toObject ();
	var matched = false;

	for (var key in event_keys) {

		var args    = event_keys[key].args;
		var emitter = event_keys[key].emitter;

		if (criteria_match (args, sock, __msg)) {

			if (argv['show-on-message-match'])
				console.log (colors.dim (`match ok ${key}`))

			console.log (colors.yellow (`>>>> incoming message socket (user_id = ${sock.user_id})`));
			utils.print_pdu (msg, 'in', 'socket');

			emitter.emit (key, {
				msg      : msg,
				user_id  : sock.user_id,
				sock     : sock,
			});

			matched = true;
			continue;
		}

		if (argv['show-on-message-match'])
			console.log (colors.dim (`match failed ${key} [ args : ${JSON.stringify (args, null, 2)} ]`))
	}

	return matched;
}

function criteria_match (args, sock, __msg) {
	var unchecked = Object.keys (args).length;

	for (var arg in args) {
		var value_to_check = args[arg];

		switch (arg) {

			case 'socket':
				if (argv['show-on-message-match'])
					console.log (colors.dim (`arg "${arg}" ${value_to_check == true ? "matched" : "not matched"} [ "${value_to_check}" == "${true}"]`))
				if (value_to_check == true)
					unchecked --;
				break;

			case 'msg-id':
				if (argv['show-on-message-match'])
					console.log (colors.dim (`arg "${arg}" ${value_to_check == __msg.header.id ? "matched" : "not matched"} [ "${value_to_check}" == "${__msg.header.id}"]`))
				if (value_to_check == __msg.header.id)
					unchecked --;
				break;

			case 'id':
				if (argv['show-on-message-match'])
					console.log (colors.dim (`arg "${arg}" ${value_to_check == sock.user_id ? "matched" : "not matched"} [ "${value_to_check}" == "${sock.user_id}"]`))
				if (value_to_check == sock.user_id)
					unchecked --;
				break;

			case 'from':
				if (argv['show-on-message-match'])
					console.log (colors.dim (`arg "${arg}" ${value_to_check == __msg.header.from ? "matched" : "not matched"} [ "${value_to_check}" == "${__msg.header.from}"]`))
				if (value_to_check == __msg.header.from)
					unchecked --;
				break;

			default:
				console.log (colors.red (`unknown cirteria value arg "${arg}", value "${value_to_check}"`));
				break;
		}

	}

	return unchecked ? false : true;
}
var event_keys = {};
SOCKET.on_message = async function (options, args) {
	var _d = promise.pending ();
	var key = 'on-message%%';
	var emitter = options.emitter;

	/* Create a simple hash from the argumets */
	for (var prop in args)
		key += `${prop}%${args[prop]},`;

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

SOCKET.ack = async function (options, args) {
	var _d           = promise.pending ();
	var trigger_data = options.trigger_data;
	var __msg        = trigger_data && trigger_data.msg
	var status       = args && args.status;
	var reason       = args && args.reason;
	var sock         = trigger_data && trigger_data.sock;

	try {
		if (!trigger_data)
			throw 'need trigger_data for event driven callbacks';

		if (!status)
			throw 'need argument "status"';

		if (status !== 'ok' && status !== 'not-ok')
			throw `invalid value of status = "${status}"`;

		/*
		 * Create the PDU */
		status = status == 'ok' ? true : false;

		if (!status && !args.reason)
			throw 'need argument "reason"';

		var msg = new protocol (__msg.toObject ());
		if (status)
			msg.make_ack (status, null, {});
		else
			msg.make_ack (status, reason, null);

		sock.send (msg.toString (), { compress : false }, function (err) {

			if (err)
				return _d.reject (e);

			_d.resolve ({
				request        : msg,
				response       : null,
				return_value   : false,
				callback_event : null,
				transport      : 'socket'
			});
		});
	}
	catch (e) {
		_d.reject (e);
	}

	return _d.promise;
};

SOCKET.accept_call = async function (options, args) {
	var _d           = promise.pending ();
	var user         = args && args.user;
	var call_id      = args && args.call_id;

	try {
		if (!user)
			throw 'need argument "user"';
		if (!call_id)
			throw 'need argument "call_id"';

		/*
		 * Create the PDU */
		var msg = new protocol ({
			header : {
				id:     'CALL-ACCEPTED',
				to:     `${user.node_id}=${user.node_type}`,
				from:   `${user.aep}`,
				type:   'req'
			},
			payload : {
				id   : call_id,
			}
		});

		var _r        = await request (user.sock, msg);

		_d.resolve ({
			request        : msg,
			response       : _r,
			return_value   : true,
			callback_event : null,
			transport      : 'socket'
		});
	}
	catch (e) {
		_d.reject (e);
	}

	return _d.promise;
};

SOCKET.reject_call = async function (options, args) {
	var _d           = promise.pending ();
	var user         = args && args.user;
	var call_id      = args && args.call_id;

	try {
		if (!user)
			throw 'need argument "user"';
		if (!call_id)
			throw 'need argument "call_id"';

		/*
		 * Create the PDU */
		var msg = new protocol ({
			header : {
				id:     'CALL-REJECTED',
				to:     `${user.node_id}=${user.node_type}`,
				from:   `${user.aep}`,
				type:   'req'
			},
			payload : {
				id   : call_id,
			}
		});

		var _r        = await request (user.sock, msg);

		_d.resolve ({
			request        : msg,
			response       : _r,
			return_value   : true,
			callback_event : null,
			transport      : 'socket'
		});
	}
	catch (e) {
		_d.reject (e);
	}

	return _d.promise;
};

SOCKET.end_call = async function (options, args) {
	var _d           = promise.pending ();
	var user         = args && args.user;
	var call_id      = args && args.call_id;

	try {
		if (!user)
			throw 'need argument "user"';
		if (!call_id)
			throw 'need argument "call_id"';

		/*
		 * Create the PDU */
		var msg = new protocol ({
			header : {
				id:     'END-CALL',
				to:     `${user.node_id}=${user.node_type}`,
				from:   `${user.aep}`,
				type:   'req'
			},
			payload : {
				id   : call_id,
			}
		});

		var _r        = await request (user.sock, msg);

		_d.resolve ({
			request        : msg,
			response       : _r,
			return_value   : true,
			callback_event : null,
			transport      : 'socket'
		});
	}
	catch (e) {
		_d.reject (e);
	}

	return _d.promise;
};

SOCKET.call = async function (options, args) {
	var _d           = promise.pending ();
	var user         = args && args.user;
	var call_id      = args && args.call_id;
	var agent_ae     = args && args['agnet-aep'];

	try {
		if (!user)
			throw 'need argument "user"';
		if (user.user_type === 'agent' && !call_id)
			throw 'need argument "call_id" for user type "agent"';

		/*
		 * Create the PDU */
		var msg = new protocol ({
			header : {
				id:     'CALL',
				to:     `${user.node_id}=${user.node_type}`,
				from:   `${user.aep}`,
				type:   'req'
			},
			payload : {
				group   : user.group,
				agent_ae: agent_ae,
			}
		});

		var _r        = await request (user.sock, msg);

		_d.resolve ({
			request        : msg,
			response       : _r,
			return_value   : true,
			callback_event : null,
			transport      : 'socket'
		});
	}
	catch (e) {
		_d.reject (e);
	}

	return _d.promise;
};

module.exports = SOCKET;
