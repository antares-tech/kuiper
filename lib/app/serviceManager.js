const natsiface     = require ('../nats-iface');
const config        = require ('../../common/config');
const log           = require ('../../utils/log').child ({ module : 'lib/serviceManager'});

const serviceManager  = {};

/*
 * This should be configurable */
let map     = {};
let cache   = {};

let __config = config.defaults.app;

serviceManager.init = function (appConfig) {
	return new Promise (function (resolve/*, reject*/) {
		__config   = {
			...__config,
			...appConfig
		};

		/* Modify channel names according to namespace, if it is recieved from upstream */
		addNamespace ();

		natsiface.open_channel (config.channels.discovery, parseMsg);
		serviceManager.ask ();

		resolve();
	});
};

serviceManager.ask = function () {
	let msg = appMsg ();

	log.debug ({msg : msg, channel : config.channels.pull}, 'sending msg on nats');
	natsiface.send (config.channels.pull, msg);
};

/*
 * parse instance info and adjust service map accordingly*/
serviceManager.info = function (srv_msg) {
	let header  = srv_msg.header;
	let payload = srv_msg.payload;

	switch (payload.state) {
		case 'active' : 
			payload.last_active = header.timestamp;
			beaconActive (payload, 'beacon recieved');
			break;

		case 'down' : 
			beaconDown (payload, 'service shutting down');
			break;
	}
};

serviceManager.getServices = function (which) {
	if (!which)
		return map;
};

/*
 * Get all the usable instances of a service */
serviceManager.getInstancesCached = function (s_name) {
	/*
	 * This returns cached maps optimsied for load-balancer needs (array form)
	 * NEVER READ FOLLOWING INFO FROM CACHE
	 *  - last_active (will be old)
	 *  - state (will be incorrect, will always be set to active)*/
	if (!cache[s_name])
		cache[s_name] = [];

	return cache[s_name];
};

/*
 * Perform requested operation on instance */
serviceManager.updateInstance = function (serviceType, serviceId, operation) {
	let __instance = map [serviceType][serviceId];
	if (!__instance) {
		log.error ({serviceType, serviceId, operation, map}, 'no such service, ignoring operation');
		return;
	}
	switch (operation) {
		case 'ADD_FAILURE' :
			addFailure (__instance);
			break;

		case 'SUBTRACT_FAILURE' :
			subtractFailure (__instance);
			break;

		case 'RESET_FAILURE' :
			resetFailure (__instance);
			break;

		case 'REMOVE_INSTANCE' :
			removeInstance (__instance);
			break;

		default : 
			log.error ({operation}, 'no such operation defined');
			break;
	}
};

function addFailure (instance) {
	instance.failure_count ++;

	if (instance.failure_count <= 3) {
		beaconMaybeActive (instance, 'atleast one failure');
		return;
	}

	beaconDown (instance, 'failed too many times');
}

function subtractFailure (instance) {
	instance.failure_count --;
	instance.failure_count = instance.failure_count < 0 ? 0 : instance.failure_count;
	

	if (instance.failure_count === 0) {
		beaconActive (instance, 'failed count reduced to 0');
		return;
	}
}

function resetFailure (instance) {
	instance.failure_count = 0;
	beaconActive (instance, 'failed count reset');
}

function removeInstance (instance) {
	beaconDown (instance, 'user defined action');
}

/*
 * Parse and handle messages from nats */
function parseMsg (err, channel, __msg/*, replyTo*/) {

	if (err) 
		return log.error ({err : err, channel : channel, msg : __msg}, 'error parsing message');

	let msg = __msg;

	switch (msg.header['msg-name']) {
		case 'service-announcement' :
			serviceManager.info (msg);
			break;

		default :
			log.error ({msg : msg}, 'unrecognised msg name. ignored');
			break;
	}
}

/* Add beacon to map and rebuild cache if needed */
function beaconActive (instance, reason) {
	log.info ({instance, reason}, 'mark instance active');
	instance.failure_count = 0;
	instance.state         = 'active';
	if (!map[instance.name])
		map[instance.name] = {};

	if (!map[instance.name][instance.id])  {
		log.info ({srv_instance : instance}, 'new instance discovered');
		map[instance.name][instance.id] = instance;
		rebuildCache (instance.name);
		return;
	}

	/*
	 * Not new service, just modify the map with latest info */
	map[instance.name][instance.id] = instance;
}

/*
 * Update beacon, rebuild cache */
function beaconMaybeActive (instance, reason) {
	if (!map[instance.name] || !map[instance.name][instance.id]) {
		log.warn ({instance : instance}, 'no such service(to mark maybe-active) in service map, moving on');
		return;
	}

	log.info ({service : instance, reason : reason}, 'service maybe-active');
	instance.state = 'maybe-active';
	map[instance.name][instance.id] = instance;
}

/*
 * Delete beacon, rebuild cache */
function beaconDown (__payload, reason) {
	if (!map[__payload.name] || !map[__payload.name][__payload.id])
		return log.warn ({__payload : __payload}, 'no such service(to delete) in service map, moving on');

	log.info ({service : __payload, reason : reason}, 'service down. deleting map entry');
	delete map[__payload.name][__payload.id];
	rebuildCache (__payload.name);
	return;
}

/*
 * rebuild service_cache array for given service */
function rebuildCache (__s_name) {
	/*
	 * TODO
	 * Right now rebuilding whole cache
	 * could later be optimisd to only add or delete required entries, instead of full rebuild */
	cache[__s_name] = [];

	for (let __srv_id in map[__s_name]) 
		cache[__s_name].push (map[__s_name][__srv_id]);
}

/*
 * delete stale entries based on 
 * - Number of missed pings
 * - Number of failed calls */
function prune (s_name) {
	/*
	 * See if any service needs to be downed */
	let delete_these = [];
	/*
	 * Find which keys to delete*/
	for (let s_id in map[s_name]) {
		/*
		 * If instance is 4times older than beacon interval delete the entry */
		let instance_time = new Date (map[s_name][s_id].last_active);
		let now           = new Date ();
		let diff          = Math.floor((now - instance_time) / 1000);
		let missed_pings  = Math.floor(diff / (__config.beaconInterval / 1000));

		if (missed_pings > 3 || map[s_name][s_id].failure_count > 3) {
			/*
			 * delete this entry it's either :
			 * - too old -missed 4 pings 
			 * - or failed atleast 4 times */
			delete_these.push(s_id);
		}
	}

	/*
	 * Actual delete entries `*/
	for (let i = 0 ; i < delete_these.length; i++) 
		beaconDown (map[s_name][delete_these[i]], 'timely pruning (either too many failure or too many missed pings)');
}

function addNamespace () {
	if (!__config.namespace)
		return;

	config.channels.discovery = `${__config.namespace}.${config.channels.discovery}`;
	config.channels.pull      = `${__config.namespace}.${config.channels.pull}`;
}

/*
 * Services which are not used by a certain app wont get pruned
 * and will keep on stacking since prune won't get triggered (no api call to that service)
 * delete all stale entries from each service */
setInterval (mapCleaner, 4 * __config.beaconInterval);

function mapCleaner () {
	for (let s_name in map)
		prune (s_name);
}

function appMsg () {
	let msg = {};

	msg.header  = {
		'msg-name' :  'service-demand',
		'timestamp':  new Date().toISOString(),
		'from'     : 'app/' + __config.name,
	};
	msg.payload = {
		'name' : __config.name,
		'proto': 'http',
	};

	return msg;
}

module.exports = serviceManager;
