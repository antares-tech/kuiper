#!/usr/bin/env node

module.exports = async function () {
	require('app-module-path').addPath(__dirname + '/../../../');
	var express         = require('express');
	var moment          = require('moment');
	var path            = require('path');
	var cookieParser    = require('cookie-parser');
	var bodyParser      = require('body-parser');
	var session         = require('express-session');
	var e_logger        = require('express-bunyan-logger');
	var http            = require('http');
	var log             = require('common/log').child ({ module : 'lib/startup' });
	var store           = require('common/store');
	var microservice    = require('services/common/lib/m-routines');
	var routes          = require('services/common/lib/routes-default');
	var Error_3A        = require('common/3a-error');

	var app_handle;
	var app = express();

	try {
		app_handle = require(store.get('app_js'));
		await app_handle.pre_init (app);
	}
	catch (e) {
		log.error ({ err : e, stack : e.stack }, 'app load or pre_init failed');
		process.exit (1);
	}

	app.use(cookieParser());
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: false }));

	/*
	 * Add express request logger */
	app.use(e_logger({
		/* genReqId: function (req) { return req.req_id; }, */
		format: "HTTP :incoming :status-code :method :url :remote-address",
		excludes : [ 'req' , 'res', 'req-headers', 'res-headers', 'user-agent',
			'body', 'short-body', 'response-hrtime', 'http-version',
			'incoming', 'remote-address', 'method', 'url', 'status-code', 'ip'
		],
		levelFn : function (status, err, meta) {
			if (status >= 300)
				return 'warn';
		},
		logger:log
	}));

	/**
	 * Add Routes (before server listen)
	 */

	routes.add_default (app);
	app_handle.add_routes (app);

	/*
	 * Add express error handler */
	app.use(e_logger.errorLogger({
		showStack : true
	}));

	/**
	 * Create HTTP server.
	 */

	var server = http.createServer(app);

	/**
	 * Listen on a port provided by the OS, on all network interfaces.
	 */

	server.listen(0);
	server.on('error', onError);
	server.on('listening', async () => {
		var addr = server.address();
		var port = addr.port;

		store.set ('port', port);
		trumpet ();

		try {
			var result = await microservice.standard_init (app);

			if (app_handle.post_init)
				await app_handle.post_init (app, result);

			log.info ('initialization sequence complete');
		}
		catch (e) {
			log.error ({ err : e, stack : e.stack }, 'error in initialization sequence. aborting.');
			process.exit (1);
		}
	});

	/**
	 * Event listener for HTTP server "error" event.
	 */

	function onError(error) {
		if (error.syscall !== 'listen') {
			throw error;
		}

		var bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

		switch (error.code) {
			case 'EACCES':
				log.error (bind + ' requires elevated privileges');
				process.exit(1);
				break;
			case 'EADDRINUSE':
				log.error (bind + ' is already in use');
				process.exit(1);
				break;
			default:
				throw error;
		}
	}

	function trumpet () {

		log.info ('#--------------------------------------------------------------#');
		log.info ('# name         : ' + store.get ('name'));
		log.info ('# description  : ' + store.get ('name-pretty'));
		log.info ('# port         : ' + store.get ('port'));
		log.info ('# id           : ' + store.get ('id'));
		log.info ('# tags         : ' + store.get ('tags').map(function (curr) { return curr; }));
		log.info ('# start ts     : ' + store.get ('start_ts'));
		log.info ('#--------------------------------------------------------------#');
	}

	/*
	 * "Not found" handler
	 */
	app.use (function (req, res, next) {
		return res.status (404).send (`resource "${req.originalUrl}" does not exist`);
	});

	/*
	 * Error handlers
	 * --------------------
	 * Development error handler - will print stacktrace
	 */

	app.use(function(__err, req, res, next) {
		var err = new Error_3A ('ERR_WTF', 500, `caught error "${JSON.stringify(__err)}". url = ${req.originalUrl}`);
		return res.status(500).send(err.serialize());
	});
};
