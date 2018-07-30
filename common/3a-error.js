var log  = require ('./log');

class Error_3A extends Error {
	constructor (key, status_code_recommended, detail_message) {
		super (key);
		this.name        = key;
		this.status_code = status_code_recommended;
		this.message     = detail_message;
	}

	serialize () {
		return {
			name        : this.name,
			status_code : this.status_code,
			message     : this.message,
			stack       : this.stack
		};
	}
}

module.exports = Error_3A;
