var tokenizer = require('tokenizer');

var t = new tokenizer ();

t.addRule (/^[\n]+$/, 'EOL');
t.addRule (/^[ \t]+$/, 'WHITESPACE');
t.addRule (/^[a-zA-Z0-9_-]+$/, 'WORD');
t.on ('token', handle_token); 

t.on ('end', function () {
	console.log ('----------------- end of stream')
})


t.write ('hello I am \n');
function handle_token (token, type) {
	console.log (`token = ${token}, type = ${JSON.stringify (type, null, 2)}`)
}
