/*
 * My addressable endpoint */

var store  = require ('common/store');
var log    = require ('common/log').child({ module : 'identity' });

var my_pid           = process.pid;
var id               = store.get ('id');

if (!id) {
	log.error (`id not set. need it to set my identity. aborting.`);
	process.exit (1);
}

module.exports = function () {
	return {
		id   : id,
		pid  : my_pid
	};
};
