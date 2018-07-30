var events   = require('events');
var bunyan   = require('bunyan');

var log = {};
var emitter = new events.EventEmitter();
var children = [];

if (process.env.NODE_ENV !== 'production') {
	log = bunyan.createLogger ({ 
		name : 'auth',
		streams : [
			{
				name : "stdout",
				stream : process.stdout,
				level  : 'debug'
			},
		]
	});
}
else {
	/* This is production environment */
	log = bunyan.createLogger ({ 
		name : 'auth',
		streams : [
			{
				type : "rotating-file",
				path : './logs/auth.log',
				level  : 'debug'
			},
		]
	});
}

function sub_app (sub_app) {
	var child = log.child ({sub_app:sub_app});
	children.push(child);
	return child;
}

function sub_module (module) {
	var child = log.child ({module:module});
	children.push(child);
	return child;
}

module.exports = log;
module.exports.emitter = emitter;
module.exports.sub_app = sub_app;
module.exports.sub_module = sub_module;
