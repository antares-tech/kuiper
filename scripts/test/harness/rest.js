var moment   = require ('moment');
var ws       = require ('ws');
var minimist = require ('minimist');
var promise  = require ('bluebird');
var colors   = require ('colors');
var store    = require ('common/store');
var protocol = require ('common/protocol');
var utils    = require ('./utils');
var service  = require ('./service');
var __rest   = require ('./lib-rest');

var REST = {};
var argv = minimist (process.argv.slice(2));
var global_timeout = 5000;

REST.init = async function (options, args) {
	var _d          = promise.pending ();
	var is_usher    = args && args.usher;
	var is_presence = args && args.presence;
	var is_lobby    = args && args.lobby;
	var id          = args && args.id;
	var host        = args && args.host;
	var port        = args && args.port;
	var prefix      = args && args['proxy-prefix'];
	var _r;

	try {
		if (!id)
			throw 'need argument "id"';
		if (!is_usher && !is_presence && !is_lobby)
			throw 'need argument : need either "usher", "presence" or "lobby"';

		let type = is_usher ? 'service' : 'app';

		if (type === 'app') {
			if (!host)
				throw 'need argument "host"';
			if (!port)
				throw 'need argument "port"';
		}

		if (type === 'service') {
			let info = await service.get_one ('usher', id);

			_r = {
				proto      : 'http',
				host       : info.host,
				port       : info.port,
				is_service : true,
				type       : 'usher',
				node_id    : id,
				prefix     : null
			};
		}
		else {
			_r = {
				proto      : 'http',
				host       : host,
				port       : port,
				is_service : false,
				type       : is_presence ? 'presence' : 'lobby',
				node_id    : id,
				prefix     : prefix
			};
		}

		_d.resolve ({
			request        : null,
			response       : _r,
			return_value   : true,
			callback_event : null,
			transport      : 'rest'
		});
	}
	catch (e) {
		_d.reject (e);
	}

	return _d.promise;
};

REST.get = async function (options, args) {
	var _d          = promise.pending ();
	var node        = args && args.node;
	var path        = args && args.path;
	var timeout     = args && args.timeout;
	var _r;

	try {
		if (!node)
			throw 'need argument "node"';
		if (!path)
			throw 'need argument "path"';

		if (!node.host || !node.port || !node.proto)
			throw 'no host or port or protocol defined for the given node';

		let url = `${node.proto}://${node.host}:${node.port}${path}`;

		_r      = await __rest.get (url, { timeout : timeout || global_timeout })

		_d.resolve ({
			request        : null,
			response       : _r,
			return_value   : true,
			callback_event : null,
			transport      : 'rest'
		});
	}
	catch (e) {
		_d.reject (e);
	}

	return _d.promise;
};

module.exports = REST;
