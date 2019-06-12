let config = {};

config.channels = {
	discovery : 'service.discovery',
	pull      : 'service.pull'
};


/*
 * Default config for app and service side of things
 * defaults can be overwritten during init and dynamically maybe in future
 *
 * TODO
 * (In case the above mentioned future has arrived please edit this comment)*/

let beaconInterval = 15 * 1000;

config.defaults = {
	service : {
		beaconInterval : beaconInterval
	},
	app : {
		beaconInterval : beaconInterval
	}
};

module.exports = config;
