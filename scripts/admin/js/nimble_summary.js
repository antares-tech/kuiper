#!/usr/bin/env node

var rest     = require('restler');
var minimist = require('minimist');
var path     = require('path');

var args    = minimist (process.argv.slice(2));
var driveId = args['drive-id'];
var score   = args['score'];
var userId  = args['user-id'];
var dist    = args['distance'];

if (!driveId || !score || !dist) {
    console.log('Usage : node ' + path.basename (process.argv[1]) + ' --drive-id <uuid> --user-id <user-id> --score <drive-score> --distance <distance>');
    process.exit(1);
}

var data = {
	timestamp : 122222345,
	score     : score,
	userId    : userId,
	dist      : dist
};

rest.postJson(`http://localhost:3001/summary/${driveId}`, data).on('complete', function(data, response) {
	console.log (data);
});


