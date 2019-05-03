var consul     = require ('consul')({ promisify : true });
var log        = require ('common/log').child ({ module : 'consul' });
var store      = require ('common/store');
var args       = require ('services/common/lib/args').argv;
var sig_h      = require ('services/common/lib/signal-handlers');

var consul_routines = {};

consul_routines.init = function () {
	var port = store.get ('port');

	return new Promise ((resolve, reject) => {
		var options = {
			name   : store.get ('name'),
			id     : store.get ('id'),
			tags   : store.get ('tags'),
			address: args.host,
			port   : store.get ('port'),
		};

		consul.agent.service.register (options, function (err) {

			if (err) {
				log.error ({ err : err }, 'service register failed');
				return reject (err);
			}

			log.info ('service register ok');
			resolve ();

			sig_h.register_deinit_handler ('service discovery', consul_routines.deinit);
		});
	});
};

consul_routines.deinit = async function (print) {
	return new Promise (async (resolve, reject) => {
		var options = {
			id : store.get ('id'),
		};

		consul.agent.service.deregister (options, function (err) {
			if (err) {
				print (err);
				return reject (err);
			}

			resolve ();
		});
	});
};

module.exports = consul_routines;
