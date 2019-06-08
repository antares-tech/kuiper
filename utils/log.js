var bunyan        = require('bunyan');

var log = {};
var name  = 'Kuiper';
var type  = 'rotating-file';
var level = 'trace';

if (process.env.NODE_ENV !== 'production') {
	log = bunyan.createLogger ({ 
		name : `${name}.${type}`,
		streams : [
			{
				name : "stdout",
				stream : process.stdout,
				level  : level || 'debug'
			},
		]
	});
}
else {
	/* This is production environment */
	log = bunyan.createLogger ({ 
		name : 'kuiper',
		streams : [
			{
				type : "rotating-file",
				path : './logs/kuiper.log',
				level  : 'debug'
			},
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

		children [i].child.levels (stream, level);
	}
};

module.exports = log;
