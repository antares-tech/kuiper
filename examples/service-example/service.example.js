/* eslint no-console : off */
const serviceClient = require ('../../kuiper').serviceClient;
const log           = require ('../../utils/log').child ({module : 'test/service-example/service.example'});

const http   = require('http');
const server = http.createServer();
server.listen(0, function (err) {
	if (err) {
		log.error ({err : err}, 'service start error');
		return;
	}
	main (server.address ().port);
});

async function main (port) {

	try {
		await serviceClient.init ({
			id   : 'exampleService-01',
			name : 'exampleService',
			port : port,
			namespace : 'namespace01'
		});
	}
	catch (err) {
		log.error ({err : err}, 'serviceClient init error');
		return;
	}

	log.info ('serviceClient init ok');

	process.on ('SIGINT', async function () {
		console.log ('Process exiting');
		try {
			await serviceClient.deinit ();
			console.log ('Service deinit ok');
		}
		catch (err) {
			console.error({err : err}, 'error in service deinit');
		}
	});
}
