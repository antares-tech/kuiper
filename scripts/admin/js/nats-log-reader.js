#!/usr/bin/env node

var _stan    = require('node-nats-streaming');
var minimist = require ('minimist');

/*
	*     *  *  * Handle arguments */
var _argv = minimist(process.argv.slice(2));

if (process.argv.length < 5) {
    console.log ('Usage: node ' + process.argv[1] + ' --cluster-name <cluster-name> --client-id <client-id> --subscription-name <subscription-name>');
    process.exit (1);
}

var cluster_name = _argv['cluster-name'];
var client_id    = _argv['client-id'];
var subscription = _argv['subscription-name'];

var connection = {
	cluster_name : cluster_name,
	client_id    : client_id,
	subscription : subscription
};

var stan = _stan.connect(connection.cluster_name, connection.client_id);

stan.on('connect', function () {
	console.log('connected');

	var opts = stan.subscriptionOptions().setDeliverAllAvailable();
	var subscription = stan.subscribe(connection.subscription, opts);
	
	subscription.on('message', function (msg) {
		process.stdout.write(msg.getData());
	});
});
