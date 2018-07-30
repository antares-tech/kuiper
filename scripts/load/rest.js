var restify = require ('restify-clients');
var promise = require ('bluebird');

class rest {
	constructor (options) {
		this.client = restify.createJsonClient (options);
	}

	get (path) {
		var p = promise.pending ();

		this.client.get (path, function (err, req, res, obj) {
			if (err)
				return p.reject (err);
			return p.resolve (obj);
		});

		return p.promise;
	}
}

module.exports = rest;
