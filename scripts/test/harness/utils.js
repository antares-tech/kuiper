var promise  = require ('bluebird');
var events   = require ('events');
var colors   = require ('colors');
var store    = require ('common/store');

var utils = {};
var prefix = '    ';
var emitter = new events ();

utils.sleep = async function (options, args) {
	var _d = promise.pending ();
	var timeout = args && args.timeout

	if (!timeout)
		throw 'need argument "timeout"';

	setTimeout (function () {
		_d.resolve ({
			response       : null,
			return_value   : false,
			callback_event : null,
		});
	}, timeout);

	return _d.promise;
};

utils.assert = async function (options, args) {
	var _d = promise.pending ();
	var bool = args && args.expr;

	if (bool) {
		_d.resolve ({
			response       : null,
			return_value   : false,
			callback_event : null,
		});
	}
	else {
		_d.reject ('assertion failed');
	}

	return _d.promise;
};

var exit_promise = promise.pending ();

utils.wait_for_exit = async function (options, args) {
	var _d = promise.pending ();
	var timeout = args && args.timeout;
	var status  = args && args.status;

	if (status)
		if (status !== 'pass' && status !== 'fail')
			throw 'status can only be either "pass" or "fail"';

	if (timeout)
		setTimeout (function () {
			if (status === 'ok')
				exit_promise.resolve ('pass');
			else
				exit_promise.reject ('fail');
		}, timeout);

	exit_promise.promise.then (
		function (e) {
			_d.resolve ({
				response       : e,
				return_value   : true,
				callback_event : null,
			});
		},
		function (e) {
			_d.reject ({
				response       : e,
				return_value   : true,
				callback_event : null,
			});
		},
	)
	;

	return _d.promise;
};

utils.exit = async function (options, args) {
	var _d = promise.pending ();
	var timeout = args && args.timeout
	var status  = args && args.status;

	if (status) {
		if (status !== 'pass' && status !== 'fail')
			throw 'status can only be either "pass" or "fail"';
	}
	else
		status = 'pass';

	if (status === 'pass')
		exit_promise.resolve (status);
	else
		exit_promise.reject (status);

	_d.resolve ({
		response       : null,
		return_value   : false,
		callback_event : null,
		exit           : true
	});

	return _d.promise;
};

utils.print_pdu = function (msg, __in_out, transport) {
	var in_out     = __in_out === 'in' ? '<<' : ('out' ? '>>' : '');
	var trans      = colors.dim (`[${transport}]`);
	var v          = colors.dim (`v${msg.v}`);
	var type       = colors.blue (`${msg.type}`);
	var id         = colors.yellow (`${msg.id}`);
	var ts         = colors.dim (`${msg.ts}`);
	var tag        = colors.dim (`${msg.tag}`);
	var from       = colors.blue (`${msg.from}`);
	var to         = colors.blue (` => ${msg.to}`);
	var reason     = msg.reason ? colors.red (`${msg.reason}`) : null;

	if (in_out)
		in_out = colors.blue (in_out);

	/*
	 * Print header */
	console.log (`${in_out} ${v} ${type} ${id} ${ts} ${tag} ${from}${to} ${trans}`);
	if (reason)
		console.log (reason);

	/*
	 * Print payload */
	var payload = JSON.stringify (msg.payload, null, 2);
	console.log (colors.dim (payload));
};

module.exports = utils;
