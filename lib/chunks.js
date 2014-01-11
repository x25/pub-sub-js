var events = require('events');
var util = require('util');

function Chunks(separator) {
	events.EventEmitter.call(this);

	this.buffer = '';
	this.separator = separator;
}

util.inherits(Chunks, events.EventEmitter);

Chunks.prototype.add = function (string) {
	var chunks = string.split(this.separator);

	while (chunks.length > 1) {
		if (this.buffer.length > 0) {
			this.buffer += chunks.shift();
			this.emit('chunk', this.buffer);
			this.buffer = '';
		}
		else {
			this.emit('chunk', chunks.shift());
		}
	}

	this.buffer += chunks.shift();
};

module.exports.Chunks = Chunks;
