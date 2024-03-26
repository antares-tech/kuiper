var bunyan = require('bunyan');

let log   = {};
let name  = 'Kuiper';
let type  = 'stdout';
let level = 'error';

let children = [];

log = bunyan.createLogger ({ 
	name : `${name}.${type}`,
	streams : [
		{
			name : "stdout",
			stream : process.stdout,
			level  : level,
		},
	],
	serializers: bunyan.stdSerializers
});


function sub_app (__sub_app) {
	var child = log.child ({sub_app:__sub_app});
	children.push(child);
	return child;
}

function sub_module (module) {
	var child = log.child ({module:module});
	children.push(child);
	return child;
}

log.sub_app = sub_app;
log.sub_module = sub_module;

module.exports = log;
