var store = require ('common/store');

/*
 * A publicly reachable endpoint comprised
 * of the following:
 *     - public host
 *     - public port
 *     - public path prefix
 *     - public protocol
 *     - local host
 *     - local port
 *     - local protocol
 */

class NetworkEndpoint {
	constructor (transport) {

		if (transport !== 'ws' && transport !== 'rest')
			throw new Error (`unknown type "type" in NetworkEndpoint constructor`);

		this.external = {};
		this.local    = {};

		var name = store.get ('name');
		if (!name)
			throw new Error (`"name" not found in store`);
		var type = store.get ('type');
		if (!type)
			throw new Error (`"type" not found in store`);

		this.external.host   = store.get (`config/${type}/${name}/network/public/${transport}/host`);
		this.external.port   = store.get (`config/${type}/${name}/network/public/${transport}/port`);
		this.external.prefix = store.get (`config/${type}/${name}/network/public/${transport}/prefix`);
		this.external.proto  = store.get (`config/${type}/${name}/network/public/${transport}/proto`);

		var s = `config/${type}/${name}/network/local/${transport}`;
		for (var i in {
			'host'   : true,
			'port'   : true,
			'proto'  : true,
		}) {

			this.local[i] = store.get (`${s}/${i}`);
			if (!this.local[i])
				throw new Error (`"${s}/${i}" not set`);
		}
	}
};

module.exports = NetworkEndpoint;
