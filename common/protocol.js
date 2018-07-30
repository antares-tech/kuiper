var moment   = require ('moment');
var log      = require ('common/log').child({ module : 'protocol' });
var store    = require ('common/store');
var pdu      = require ('common/pdu-schemas');
var aep      = require ('./addr-endpoint');
var identity = require ('./identity');

/*
 * Message structure:
 * {
 *   header : {
 *       v:      <protocol-version>,
 *       id:     <message-id>,
 *       to:     <addressable-endpoint>,
 *       from:   <addressable-endpoint>,
 *       type:   (req | ok | not-ok | info),
 *       tag:    <tag>,
 *       ts:     <ISO-format-timestamp>
 *       reason: <reason> # Mandatory only in the case of id="not-ok"
 *   }
 *
 *   payload : {
 *       <message-specific-data>
 *   }
 * }
*/

var tag_prefix = `${store.get('name')}.${identity().id}`;
var seq = 0;

class Protocol {
	constructor (msg) {
		var header = msg.header;

		msg.header.v = 1;

		/*
		 * If 'tag' and 'ts' are already defined then honor them, else 
		 * provide fresh values */
		if (!msg.header.tag)
			msg.header.tag = Protocol.generate_tag ();

		if (!msg.header.ts)
			msg.header.ts = moment ().toISOString ();

		/*
		 * Throws error on failing */
		pdu.validate (msg);

		this.msg      = msg;
		this.aep_from = new aep (header.from);
		this.aep_to   = new aep (header.to);
	}

	static generate_tag () {

		/*
		 * Wrap at 10 million, else the tag will become
		 * too long */
		if (seq > 10000000)
			seq = 0;

		seq++;
		return `${tag_prefix}.${seq}`;
	}

	toString () {
		return JSON.stringify (this.msg);
	}

	toObject () {
		/*
		 * Return a deep cloned message object */
		return JSON.parse (JSON.stringify (this.msg));
	}

	get v () {
		return this.msg.header.v;
	}

	get ts () {
		return this.msg.header.ts;
	}

	get id () {
		return this.msg.header.id;
	}

	get type () {
		return this.msg.header.type;
	}

	get payload () {
		return this.msg.payload;
	}

	get tag () {
	    return this.msg.header.tag;
	}

	get from () {
		return this.aep_from;
	}

	get reason () {
		return this.msg.header.reason;
	}

	set from (addr) {
		this.msg.header.from = addr;
		this.aep_from = new aep (addr);
	}

	get to () {
		return this.aep_to;
	}

	set to (addr) {
		this.msg.header.to = addr;
		this.aep_to = new aep (addr);
	}

	set id (id) {
		this.msg.header.id = id;
	}

	make_ack (success, reason, data) {
		var p = {};
		p.header = {};

		if (!success && !reason)
			throw 'nack needs a reason';

		p.header.v      = 1;
		p.header.type   = success ? 'ok' : 'not-ok';
		p.header.id     = this.msg.header.id;
		p.header.to     = this.msg.header.from;
		p.header.from   = this.msg.header.to;
		p.header.tag    = this.msg.header.tag;
		p.header.ts     = moment().toISOString();
		p.header.reason = success ? null : reason;

		p.payload = data;

		/*
		 * Throws error on failing */
		pdu.validate (p);

		this.msg      = p;
		this.aep_from = new aep (p.header.from);
		this.aep_to   = new aep (p.header.to);

		return this;
	}
}

module.exports = Protocol;
