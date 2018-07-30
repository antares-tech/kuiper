var schema_class = require ('common/schemaobject');

var header = new schema_class ({
	v       : { type : Number, required : true, min : 1, max : 1, default : 1 },
	id      : { type : String, required : true },
	to      : { type : String, required : true },
	from    : { type : String, required : true },
	type    : { type : String, required : true, enum : [ 'req', 'info', 'ok', 'not-ok' ]},
	tag     : { type : String },
	ts      : { type : String, required : true },
	reason  : { type : String },
});

var payloads = {

	'AUTHENTICATE' : {
		'req' : new schema_class ({
			group   : { type : String, required : true },
			id      : { type : String, required : true },
			token   : { type : String, required : true }
		}),
		'ok' : new schema_class ({
			your_aep : { type : String, required : true }
		}),
		'not-ok' : new schema_class ({}),
	},

	'WHOS-MY-USHER' : {
		'req' : new schema_class ({
			group : { type : String, required : true }
		}),
		'ok' : new schema_class ({
			id      : { type : String, required : true },
			pid     : { type : String, required : true },
			channel : { type : String, required : true },
		}),
		'not-ok' : new schema_class ({}),
	},

	'WHO-HAS' : {
		'req' : new schema_class ({
			group : { type : String, required : true }
		}),
		'ok' : new schema_class ({
			id      : { type : String, required : true },
			pid     : { type : String, required : true },
			channel : { type : String, required : true },
		}),
		'not-ok' : new schema_class ({}),
	},

	'I-AM-AVAILABLE' : {
		'req' : new schema_class ({
			group : { type : String, required : true }
		}),
		'ok' : new schema_class ({ }),
		'not-ok' : new schema_class ({}),
	},

	'ENQUEUE-CALL' : {
		'req' : new schema_class ({
			group      : { type : String, required : true },
			agent_ae   : { type : String },
			enqueue_ts : { type : String, required : true },
		}),
		'ok' : new schema_class ({ }),
		'not-ok' : new schema_class ({}),
	},

	'CALL' : {
		'req' : new schema_class ({
			group      : { type : String, required : true },
			agent_ae   : { type : String },
		}),
		'ok' : new schema_class ({ }),
		'not-ok' : new schema_class ({}),
	},

	'PLEASE-CALL' : {
		'req' : new schema_class ({
			group      : { type : String, required : true },
			agent_ae   : { type : String, required : true },
			id         : { type : String, required : true },
			caller_info     : {
				group       : { type : String, required : true },
				agent_ae    : { type : String },
				enqueue_ts  : { type : String, required : true },
				caller      : { type : String, required : true },
			},
		}),
		'ok' : new schema_class ({}),
		'not-ok' : new schema_class ({}),
	},

	'PROVIDE-UNICAST-CHANNEL' : {
		'req' : new schema_class ({}),
		'ok' : new schema_class ({
			channel : { type : String, required : true }
		}),
		'not-ok' : new schema_class ({}),
	},

	'CALL-ACCEPTED' : {
		'req' : new schema_class ({
			id      : { type : String, required : true }
		}),
		'ok' : new schema_class ({}),
		'not-ok' : new schema_class ({}),
	},

	'CALL-REJECTED' : {
		'req' : new schema_class ({
			id      : { type : String, required : true }
		}),
		'ok' : new schema_class ({}),
		'not-ok' : new schema_class ({}),
	},

	'END-CALL' : {
		'req' : new schema_class ({
			id      : { type : String, required : true }
		}),
		'ok' : new schema_class ({}),
		'not-ok' : new schema_class ({}),
	},

	'CALL-ENDED' : {
		'info' : new schema_class ({
			id      : { type : String, required : true }
		}),
	},

	'I-AM-NOT-AVAILABLE' : {
		'req' : new schema_class ({
			group      : { type : String, required : true }
		}),
		'ok' : new schema_class ({}),
		'not-ok' : new schema_class ({}),
	},

	'GROUP-UNAVAILABLE' : {
		'info' : new schema_class ({
			group      : { type : String, required : true }
		}),
	},
};

function validate (msg) {
	var _h  = new header (msg.header);

	if (_h.isErrors ())
		throw _h.getErrors ();

	if (!payloads [_h.id])
		throw `no template for message id "${_h.id}"`;

	if (!payloads [_h.id][_h.type])
		throw `no template for type "${_h.type}" for message id "${_h.id}"`;

	var _p = new payloads [_h.id][_h.type] (msg.payload);

	if (_p.isErrors ())
		throw _p.getErrors ();
}

module.exports = {
	validate : validate
};
