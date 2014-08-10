var events = require('events');
var util = require('util');
var net = require('net');

var Parser = require('./parser').Parser;

function Publisher() {

	events.EventEmitter.call(this);

	//{"ip1:port1":socket1,"ip2:port2:socket2}
	this.sockets = {};
	//{"channel1":[socket1,socket2],"channel2":[socket2,socket3]}
	this.channels = {};
	//net.Server
	this.server = null;
}

util.inherits(Publisher, events.EventEmitter);

Publisher.prototype.publish = function (channel, data) {

	if (!(this.channels[channel] instanceof Array)) {

		return;
	}

	var packet = {
		channel: channel,
		data: data
	};

	var message = JSON.stringify(packet);

	for (var s in this.channels[channel]) {

		var socket = this.channels[channel][s];

		if (socket instanceof net.Socket) {

			socket.write(message + '\n');
		}
	}
};

Publisher.prototype.connect = function (port, host) {

	var self = this;

	var socketName = host + ':' + port;

	if (self.sockets[socketName]) {

		return;
	}

	var socket = new net.Socket();

	socket.setTimeout(60000);
	socket._reconnect = true;

	self.sockets[socketName] = socket;

	var parser = new Parser('\n', function (chunk) {

		self._data(chunk, socket);
	});

	socket.on('error', function (e) {

		self.emit('log', 'debug', 'publisher.error', e);
	});

	socket.on('connect', function () {

		self.sockets[socketName] = socket;

		self.emit('log', 'debug', 'publisher.remote', 'connected to', socketName);
	});

	socket.on('data', function (data) {

		self.emit('log', 'debug', 'publisher.remote', 'data', socketName, data.toString());

		parser.add(data.toString());
	});

	socket.on('close', function () {

		self.emit('log', 'debug', 'publisher.remote', 'close', socketName);

		self._detach(Object.keys(self.channels), socket);

		if (socket._reconnect) {

			var r = function () {

				if (self.sockets[socketName] === socket) {

					delete self.sockets[socketName];
				}

				if (socket._reconnect) {

					self.connect(port, host);
				}

			};

			setTimeout(r, 1000);

		} else {

			if (self.sockets[socketName] === socket) {

				delete self.sockets[socketName];
			}
		}
	});

	socket.on('timeout', function () {

		socket.destroy();
	});

	socket.connect(port, host);
};

Publisher.prototype.disconnect = function (port, host) {

	var socketName = host + ':' + port;

	if (this.sockets[socketName] instanceof net.Socket) {

		this.sockets[socketName]._reconnect = false;
		this.sockets[socketName].end();
	}

	delete this.sockets[socketName];
};

Publisher.prototype.listen = function (port, host) {

	var self = this;

	self.close();

	self.server = new net.Server();

	self.server.on('error', function (e) {

		console.error(e);
	});

	self.server.on('connection', function (socket) {

		var socketName = socket.remoteAddress + ':' + socket.remotePort;

		self.sockets[socketName] = socket;

		var parser = new Parser('\n', function (chunk) {

			self._data(chunk, socket);
		});

		self.emit('log', 'debug', 'publisher.server', 'connection from', socketName);

		socket.on('error', function (e) {

			console.error(e);
		});

		socket.on('data', function (data) {

			self.emit('log', 'debug', 'publisher.server', 'data', socketName, data.toString());

			parser.add(data.toString());
		});

		socket.on('close', function () {

			self.emit('log', 'debug', 'publisher.server', 'close', socketName);
			self._detach(Object.keys(self.channels), this);

			delete self.sockets[socketName];
		});
	});

	self.server.listen(port, host);
};

Publisher.prototype.close = function (callback) {

	if (this.server instanceof net.Server) {

		this.server.close(callback);
	}
};

Publisher.prototype._data = function (string, socket) {

	var packets = string.split('\n');

	for (var i = 0; i < packets.length; i++) {

		var packet = packets[i];

		var cmd = packet.substr(0, 1);
		var channels = packet.substr(1).split(',');

		if (cmd === '+') {

			this._attach(channels, socket);

		} else if (cmd === '-') {

			this._detach(channels, socket);
		}
	}
};

Publisher.prototype._attach = function (channels, socket) {

	for (var i in channels) {

		var channel = channels[i];

		if (!channel) {

			continue;
		}

		if (!(this.channels[channel] instanceof Array)) {

			this.channels[channel] = [];
		}

		if (this.channels[channel].indexOf(socket) !== -1) {

			continue;
		}

		this.emit('log', 'debug', 'publisher', 'attach', channel);
		this.channels[channel].push(socket);
	}
};

Publisher.prototype._detach = function (channels, socket) {

	for (var i in channels) {

		var channel = channels[i];

		if (!channel) {

			continue;
		}

		if (!(this.channels[channel] instanceof Array)) {

			continue;
		}

		var pos = this.channels[channel].indexOf(socket);

		if (pos === -1) {

			continue;
		}

		this.emit('log', 'debug', 'publisher', 'detach', channel);
		this.channels[channel].splice(pos, 1);

		if (!this.channels[channel].length) {

			delete this.channels[channel];
		}
	}
};

module.exports.Publisher = Publisher;
