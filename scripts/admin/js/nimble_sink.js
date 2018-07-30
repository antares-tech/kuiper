#!/usr/bin/env node

var rest     = require('restler');
var fs       = require('fs');
var minimist = require('minimist');
var path     = require('path');

var args    = minimist (process.argv.slice(2));

if (!args.file) {
    console.log('Usage : node ' + path.basename (process.argv[1]) + ' --file <path>');
    process.exit(1);
}

var data = fs.createReadStream(args.file);

data.on('data', (stream)=> {
	rest.post('http://localhost:3001/sink/abc/2', {
		data: stream,
		headers: { 'Content-Type': 'application/octet-stream' }
	}).on('complete', function(data, response) {
		console.log (data);
	});
});
    /*var buf = Buffer.from(a, 'utf8');
    var obj = messages.RawDriveData.decode(buf);
    console.log(obj);
});*/


