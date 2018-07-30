var bunyan        = require('bunyan');
var nats          = require('./nats-bunyan-connect');
var store         = require('./store');
var uuid          = require('uuid/v1');

var log = {};
var name  = store.get('name');
var type  = store.get('type');
var level = store.get('log_level');

if (process.env.NODE_ENV !== 'production') {
	log = bunyan.createLogger ({ 
		name : `${name}.${type}`,
		streams : [
			{
				name : "stdout",
				stream : process.stdout,
				level  : level || 'debug'
			},
			{
				name : "nats",
				level: bunyan.INFO,
				stream: nats.stream,
			}
		]
	});
}
else {
	/* This is production environment */
	log = bunyan.createLogger ({ 
		name : '3a',
		streams : [
			{
				type : "rotating-file",
				path : './logs/3a.log',
				level  : 'debug'
			},
			{
				name : "nats",
				level: bunyan.INFO,
				stream: nats.stream,
			}
		]
	});
}

/*
 * Overriding the "child" method of bunyan. It does not keep a 
 * track of it's children, and if the levels are changed at 
 * runtime, the new levels are not inherited by the already
 * created children. */

var child_method = log.child;
var children = [];
log.child = function (options) {
	var module = options.module;

	var __child = child_method.call (this, options);

	if (!module) {
		/*
		 * Express bunyan module also calls this method and may not
		 * specify a module. Ignore. */

		children.push ({
			module : module,
			child  : __child
		});
	}

	return __child;
};

log.set_level = function (stream, level, module) {
	for (var i = 0; i < children.length; i++) {
		if (module && (module !== children[i].module))
			continue;

		children [i].child.levels (stream, level)
	}
};

module.exports = log;
