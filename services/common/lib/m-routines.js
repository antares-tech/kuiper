var consul     = require ('./consul');
var natsiface  = require ('common/nats-iface');
var beacon     = require ('./beacon');
var log        = require ('common/log').child ({ module : 'm-routines' });
var sig_h      = require ('services/common/lib/signal-handlers');
var config     = require ('services/common/lib/remote-config');
var routes     = require ('services/common/lib/routes-default');

var m_routines = {};

m_routines.standard_init = function (app) {
	return new Promise (async (resolve, reject) => {
		try {
			await sig_h.init ();
			await consul.init ();
			await natsiface.init ();
			await beacon.init ();

			log.trace ('m-routines standard_init ok');
			resolve ();
		}
		catch (e) {
			reject (e);
		}
	});
};

function err_exit (err) {
}

module.exports = m_routines;
