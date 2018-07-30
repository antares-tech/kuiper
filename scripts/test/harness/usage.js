module.exports = function usage () {
    var file = process.argv[1].replace (/^.*\/([^\/]+$)/, "$1");

	if (file === 'main.js')
		console.log ('Usage : [node] ' + file + ' [ options ]');

	if (file === 'run-test.js')
		console.log ('Usage : [node] ' + file + ' [ options ] scenario-file');

    console.log ('        --help (OPT)              : print this help');
    console.log ('        --show-request (OPT)      : show outgoing request PDUs');
    console.log ('        --show-response (OPT)     : show incoming response PDUs');
    console.log ('        --sock-req-timeout (OPT)  : timeout for socket requests (default 2000 ms)');
    console.log ('');
    console.log ('    behaviour related options:');
    console.log ('        --no-abort-on-nack (OPT)  : do not abort if a NACK is recieved');
    console.log ('');
    console.log ('    grammar related options:');
    console.log ('        --grammar (OPT)           : scenario grammar file');
    console.log ('        --debug-grammar (OPT)     : turn on parser debugging');
    console.log ('        --debug-stream (OPT)      : turn on in stream debugging');
    console.log ('        --parse-only (OPT)        : just parse the grammar and return');
    console.log ('');
    console.log ('    debug options:');
    console.log ('        --show-js-eval (OPT)            : show javascrpt evals');
    console.log ('        --show-on-message-match  (OPT)  : show "on-message" matches');
    console.log ('        --show-sock-incoming (OPT)      : show in coming messages on sockets');
    console.log ('');

    process.exit (1);
};
