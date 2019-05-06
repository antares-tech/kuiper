const serviceClient = require ('../../kuiper').serviceClient;
const log       = require ('../../lib/log').child ({module : 'test/service-example/service.example'});
var http=require('http');
var server=http.createServer();
server.listen(0, function (err) {
	if (err) {
		log.error ({err : err}, 'seervice start error');
		return;
	}
	main (server.address ().port);
});

async function main (port) {

	try {
		await serviceClient.init ({
			id   : 'exampleService-02',
			name : 'exampleService',
			port : port
		});
	}
	catch (err) {
		log.error ({err : err}, 'serviceClient init error');
		return;
	}

	log.info ('serviceClient init ok');
}
