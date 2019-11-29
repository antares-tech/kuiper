const appClient = require ('../../kuiper').appClient;
const log       = require ('../../utils/log').child ({module : 'examples/app-example/app-example'});

let servicePrinter;

async function main () {
	try {
		await appClient.init ({
			name : 'exampleApp',
			namespace : 'namespace01'
		});
	}
	catch (err) {
		log.error ({err : err}, 'appClient init error');
		return;
	}

	log.info ('appClient init ok');
	servicePrinter = setInterval (printServices, 5 * 1000);
}

function printServices () {
	const services = appClient.getServices ();
	log.info ({services : services}, 'services list as of now');
}

function removeService () {
	const services = appClient.getServices ();

	for (let type in services) {
		for (let id in services [type]) {
			appClient.removeService (type, id);
			let services = appClient.getServices ();
			log.debug ({services}, 'service map just after removal');
			return;
		}
	}
}

main ();
