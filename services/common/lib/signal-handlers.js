var fs         = require ('fs');
var log        = require ('common/log').child ({ module : 'sig-handler' });

var sig = {};
var deinit_arr = [];

sig.register_deinit_handler = (name, deinit_handler) => {
	if (!name || !deinit_handler) {
		log.error ({ name : name, deinit_h : deinit_handler ? 'specified' : 'null' }, 'register : null parameters');
		throw 'sig-handler.register : null parameters';
	}

	log.info (`registered deinit handler for ${name}`);
	deinit_arr.push ({ name : name, deinit_h : deinit_handler });
};

sig.init = () => {
	return new Promise ((resolve, reject) => {
		var seq_init = false;

		process.stdout.on('error', async ( err ) => {
			if (err.code == "EPIPE" && !seq_init) {
				seq_init = true;
				await sig.deinit_sequence ('EPIPE');
				process.exit(0);
			}
		});
		process.on ('SIGPIPE', async () => {
			if (seq_init)
				return;

			seq_init = true;
			await sig.deinit_sequence ('SIGPIPE');
			process.exit (0);
		});
		process.on ('SIGINT', async () => {
			if (seq_init)
				return;

			seq_init = true;
			await sig.deinit_sequence ('SIGINT');
			process.exit (0);
		});
		process.on ('SIGTERM', async () => {
			if (seq_init)
				return;

			seq_init = true;
			await sig.deinit_sequence ('SIGTERM');
			process.exit (0);
		});
		resolve ();
	});
};

function deinit_log (str) {
	/*
	 * assumes 'this' to be a tty */
	this.write (`    -> ${str}\n`);
}

sig.deinit_sequence = (event) => {
	return new Promise (async (resolve, reject) => {
		var tty = fs.createWriteStream('/dev/tty');

		tty.write (`\ndeinit sequence initiated (${event})\n`);

		for (var i = deinit_arr.length - 1; i >= 0; i--) {
			try {
				await deinit_arr [i].deinit_h (deinit_log.bind (tty));
				tty.write (`  + deinit ok : ${deinit_arr[i].name}\n`);
			}
			catch (e) {
				tty.write (`  + deinit fail : ${deinit_arr[i].name} (${e})\n`);
			}
		}

		tty.write ('deinit sequence completed\n', () => {
			resolve ();
		});
	});
};

module.exports = sig;
