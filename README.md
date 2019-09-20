# kuiper [![experimental](http://badges.github.io/stability-badges/dist/experimental.svg)](http://github.com/badges/stability-badges)
Intended to be a service discovery module by [Antares Tech](http://antares-tech.com), for micro-services based architecture using simple NATS messaging.

## Base Idea
Two components:

	App      : Entity that wants to look for services.
	Service  : Entity that will announce it's presence and a way to reach them. Presence announcement will be made periodically and on demand.

Both Apps and Services will connect to a NATS server and listen on configured channels for messages. Services will broadcast their presence every "__pre-configured__" duration. In this broadcast, Services will also send out useful information such as "__networkInfo__" and other custom data if needed.

Apps will be listening to broadcast messages from services and managing, cataloging(among other things) all services. Managing will include keeping count of how many services of which type (user, media etc) are up etc. App module will provide all live services information when requested.

## Setup dev environment 
Setup your Ubuntu 18.04 Development Environment by runnning the following command
```
cd scripts
./setup.sh
```

## Usage

__NOTE__ : User will need to have a `nats` server running to be used as message broker. This module uses [nats](https://github.com/nats-io/nats.js) for service discovery protocol message transfers. 

### Bsic usage

#### App component

__IMPORTANT__ : `natsConfig`(in `appClient.init()` function call) should be in accordance with [nats](https://github.com/nats-io/nats.js) module
```javascript
const appClient = require ('kuiper').appClient;

async function init () {
	/*
	 * Configuration options for appClient */
	let config = {
		"name" : "myApp" 
	};

	try {
		await appClient.init (config /*, natsConfig */); // native JS promise
		/*
		 * Once initialised
		 * get list of services anytime by calling getServices API */
		let currentServices = appClient.getServices ();
		console.log ({currentServices}, 'list of services available at this moment');
	}
	catch (err) {
		/*
		 * handle init error */
		console.log ({err}, 'an error occured in kuiper initialisation');
	}
}

init ();
```

#### Service component

__IMPORTANT__ : `natsConfig`(in `serviceClient.init()` function call) should be in accordance with [nats](https://github.com/nats-io/nats.js) module
```javascript
const serviceClient = require ('kuiper').serviceClient;

async function init () {
	let config = {
		"id"   : "uniqueServiceID-001", //this should be unique for a service name
		"name" : "serviceType", //this is used to categories different instance of a service type on app side
	};

	try {
		await serviceClient.init (config/*, natsConfig */);
	}
	catch (err) {
		/*
		 * handle service init error */
		console.error ({err}, 'error in serviceClient init');
	}
}

init ();
```

### TODO in usages

- What kind of data will app get on `appClient.getServices ()`
- List all config options for `appClient`
- List all config options for `serviceClient`
- Examples of other config option usages
