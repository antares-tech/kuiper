class Truti extends Error {
	constructor (name, status_code_recommended, detail_message) {
		super (name);
		this.name        = name;
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

module.exports = Truti;
