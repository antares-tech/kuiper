var events = require('events');
var util   = require('util');
var assert = require('assert-plus');
var bunyan = require('bunyan');
var _stan  = require('node-nats-streaming');

function NatsStream(opts) {

	assert.object(opts, 'opts');
	assert.string(opts.cluster_name, 'opts.cluster_name');
	assert.string(opts.client_name, 'opts.client_name');
	assert.string(opts.subscription, 'opts.subscription');
	assert.optionalObject(opts.log, 'opts.log');

	events.EventEmitter.call(this);

	var self = this;
	this._subscription = opts.subscription;

	if (!opts.log) {
		this._log = bunyan.createLogger({
			name: 'bunyan-nats',
			level: opts.level || bunyan.WARN
		});
	} else {
		this._log = opts.log.childLogger({
			component: 'bunyan-nats'
		});
	}

	this.stan = _stan.connect(opts.cluster_name, opts.client_name);


	self.stan.on('connect', function () {
		self._log.info('nats ready');
		self.emit('ready');
	});

	self.stan.on('error', function (err) {
		self._log.warn(err, 'nats error');
		if (self.listeners('error').length !== 0) {
			self.emit('error', err);
		}
	});
}

util.inherits(NatsStream, events.EventEmitter);
var callback = function (err, guid) {
};
/*
var callback = function(err, guid){
		if(err) {
			self._log.warn(err, 'nats publish failed');
			if (self.listeners('error').length !== 0) {
				 return self.emit('error', err);
			}
		}

		self._log.info('nats publish success with guid: ' + guid);
	};
*/

NatsStream.prototype.write = function write(record) {
	var self = this;
	var subscription = self._subscription;
	var messages = record;

	self._log.trace(messages, 'sending messages to nats');
	self.stan.publish(subscription, messages, callback);
};

module.exports = NatsStream;
