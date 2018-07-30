var moment   = require ('moment');
var promise  = require ('bluebird');
var ws       = require ('ws').Server;
var Protocol = require ('common/protocol');
var Endpoint = require ('common/public-endpoint');
var log      = require ('common/log').child({ module : 'cc' });

var cc = {};
var addr, handlers;
var tag_map = new Map ();

cc.init = function (__handlers, path) {
	var _d  = promise.pending ();

	try {

		handlers = __handlers;

		if (!handlers.in_message || !handlers.close || !handlers.error || !path)
			throw new Error ('insufficient arguments');

		addr = new Endpoint ('ws');
		var server = {
			host : addr.local.host,
			port : addr.local.port,
			path : path,
		};

		var wss  = new ws (server);

		wss.on ('listening', function () {
			log.info (`listening on ${addr.local.host}:${addr.local.port}/agent`);
			_d.resolve ();
		});

		wss.on ('connection', handle_connect);

		/* will resolve when the server starts listening */
	}
	catch (e) {
		_d.reject (e);
	}

	return _d.promise;
};

var id_counter = 0;
function handle_connect (sock, request) {

	sock.cc_id = id_counter++;

	var context = {
		sock   : sock,
		cc_id  : sock.cc_id,
		error  : null,
		remote : {
			host : sock._socket.remoteAddress,
			port : sock._socket.remotePort
		}
	};


	log.info ({ 'remote-host' : context.remote.host, 'remote-port' : context.remote.port }, "new connection");

	sock.on ('message', function (message) {
		try {

			let __    = JSON.parse (message);
			let msg   = new Protocol (__);

			if (msg.type === 'ok' || msg.type === 'not-ok') {
				let tag      = msg.tag;
				let tag_data = sock.tag_map.get (tag);
				let promise  = tag_data && tag_data.promise;

				if (!tag_data || !promise)
					throw new Error (`stray ack for socket cc_id ${sock.cc_id}`);

				if (msg.type == 'ok')
					promise.resolve (msg);
				else
					promise.reject (msg.reason);

				sock.tag_map.delete (tag);
				return;
			}

			handlers.in_message (msg, context);
		}
		catch (e) {
			var err = e;

			if (e instanceof Error)
				err = e.message;

			log.error ({ agent_id : sock.agent_id, err : err, stack : e.stack, _msg : message }, 'error incoming handling message');
		}
	});

	sock.on ('error', function (err) {
		log.error ({ err : err }, "socket error");
		context.error = err;
		handlers.error (err, context);
	});

	sock.on ('close', function (err) {
		let tag_map = sock.tag_map;
		let keys    = tag_map && tag_map.keys ();
		let cc_id   = sock.cc_id;

		if (tag_map) {

			for (let tag = keys.next ().value; tag != null; tag = keys.next ().value) {
				let tag_data = sock.tag_map.get (tag);

				if (!tag_data) {
					log.error ({ tag : tag }, `null tag data on socket close (cc_id = ${sock.cc_id})`);
					continue;
				}

				tag_data.promise.reject ('agent connection closed');
				log.trace ({ tag : tag, agent_id : tag_data.context.agent_id }, 'closing open requests');
			}
		}

		handlers.close (context);
	});
}

cc.send = function (msg, context) {
	context.sock.send (JSON.stringify (msg.toObject()), { compress : false }, function (err) {
		if (err)
			log.error ({ agent_id : context.agent_id, 'remote-host' : context.remote.host, 'remote-port' : context.remote.port, err : err, stack : err.stack }, 'send error')
	});
};

cc.request = function (msg, context) {
	var _d    = promise.pending ();
	var sock  = context.sock;

	try {
		var tag = msg.tag;

		if (!sock.tag_map)
			sock.tag_map = new Map ();

		if (sock.tag_map.has (tag))
			throw new Error ('duplicate tag');

		sock.tag_map.set (tag, {
			context : context,
			promise : _d,
			ts      : moment ()
		});

		context.sock.send (JSON.stringify (msg.toObject()), { compress : false }, function (err) {
			if (err) {
				log.error ({ agent_id : context.agent_id, 'remote-host' : context.remote.host, 'remote-port' : context.remote.port, err : err.message, stack : err.stack }, 'request  error')
				sock.tag_map.delete (tag);
				return _d.reject (err);
			}

		});
	}
	catch (e) {
		sock.tag_map.delete (tag);
		_d.reject (e);
	}

	return _d.promise;
};

module.exports = cc;
