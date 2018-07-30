class ae {

	constructor (ae_string) {

		this.ae_string = ae_string;
		this.make_stack ();
	}

	make_stack () {
		var segments = this.ae_string.split (',');
		this.stack   = segments.map (function (current, index, array) {
			var segment =  current.split ('=');
			return {
				id   : segment [0],
				type : segment [1]
			};
		});
		this.curr   = this.stack.length - 1;
	}

	pop () {

		if (this.curr < 0)
			return null;

		var segment = this.stack [ this.curr ];
		this.curr--;

		return segment;
	}

	reset_stack () {
		this.curr   = this.stack.length - 1;
	}

	find (type) {
		for (var i = 0; i < this.stack.length; i++)
			if (this.stack[i].type == type)
				return this.stack[i].id;

		return null;
	}

	toString () {
		return this.ae_string;
	}
}

module.exports = ae;
