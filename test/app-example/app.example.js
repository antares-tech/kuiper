const appClient = require ('../../kuiper').appClient;
const log       = require ('../../lib/log').child ({module : 'test/app-example/app-example'});

async function main () {
	try {
		await appClient.init ({name : 'exampleApp'});
	}
	catch (err) {
		log.error ({err : err}, 'appClient init error');
		return;
	}

	log.info ('appClient init ok');
	setInterval (printServices, 5 * 1000);
}

function printServices () {
	const services = appClient.getServices ();
	log.info ({services : services}, 'services list as of now');
}

main ();
