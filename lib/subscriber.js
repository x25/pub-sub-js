var events = require('events');
var util = require('util');
var net = require('net');

var Parser = require('./parser').Parser;

function Subscriber() {

	events.EventEmitter.call(this);

	//{"ip1:port1":socket1,"ip2:port2:socket2}
	this.sockets = {};
	//["all","subscribed","channels"]
	this.channels = [];
	//net.Server
	this.server = null;
}

util.inherits(Subscriber, events.EventEmitter);

Subscriber.prototype.subscribe = function (channel) {

	if (channel.indexOf(',') !== -1 || channel.indexOf('\n') !== -1) {

		throw new Error('Please do not use "\\n" and "," characters in channel name.');
	}

	if (this.channels.indexOf(channel) !== -1) {

		return;
	}

	this.channels.push(channel);

	for (var s in this.sockets) {

		if (this.sockets[s] instanceof net.Socket) {

			this.sockets[s].write('+' + channel + '\n');
		}
	}
};

Subscriber.prototype.unsubscribe = function (channel) {

	var pos = this.channels.indexOf(channel);

	if (pos === -1) {

		return;
	}

	this.channels.splice(pos, 1);

	for (var s in this.sockets) {

		if (this.sockets[s] instanceof net.Socket) {

			this.sockets[s].write('-' + channel + '\n');
		}
	}
};

Subscriber.prototype.connect = function (port, host) {

	var self = this;

	var socketName = host + ':' + port;

	if (self.sockets[socketName]) {

		return;
	}

	var socket = new net.Socket();

	socket._reconnect = true;
	self.sockets[socketName] = socket;

	var buffer = new Parser('\n', function (chunk) {

		self._data(chunk);
	});

	socket.on('error', function (e) {

		self.emit('log', 'debug', 'subscriber.error', e);
	});

	socket.on('connect', function () {

		self.sockets[socketName] = socket;

		self.emit('log', 'debug', 'subscriber.remote', 'connected to', socketName);

		self._subscribe(socket);
	});

	socket.on('data', function (data) {

		self.emit('log', 'debug', 'subscriber.remote', 'data', socketName);

		buffer.add(data.toString());
	});

	socket.on('close', function () {

		self.emit('log', 'debug', 'subscriber.remote', 'close', socketName);

		if (socket._reconnect) {

			var r = function () {

				if (self.sockets[socketName] === socket) {

					delete self.sockets[socketName];
				}

				if (socket._reconnect) {

					self.connect(port, host);
				}
			};

			setTimeout(r, 100);

		} else {

			if (self.sockets[socketName] === socket) {

				delete self.sockets[socketName];
			}
		}
	});

	socket.connect(port, host);
};

Subscriber.prototype.disconnect = function (port, host) {

	var socketName = host + ':' + port;

	if (this.sockets[socketName] instanceof net.Socket) {

		this.sockets[socketName]._reconnect = false;
		this.sockets[socketName].end();
	}

	delete this.sockets[socketName];
};

Subscriber.prototype.listen = function (port, host) {

	var self = this;

	self.close();

	self.server = new net.Server();

	self.server.on('error', function (e) {

		console.error(e);
	});

	self.server.on('connection', function (socket) {

		var socketName = socket.remoteAddress + ':' + socket.remotePort;

		self.sockets[socketName] = socket;

		var buffer = new Parser('\n', function (chunk) {

			self._data(chunk);
		});

		self.emit('log', 'debug', 'subscriber.server', 'connection from', socketName);

		socket.on('error', function (e) {

			console.error(e);
		});

		socket.on('data', function (data) {

//			self.emit('log', 'debug', 'subscriber.server', 'data', socketName);

			buffer.add(data.toString());
		});

		socket.on('close', function () {

			self.emit('log', 'debug', 'subscriber.server', 'close', socketName);

			delete self.sockets[socketName];
		});

		self._subscribe(socket);
	});

	self.server.listen(port, host);
};

Subscriber.prototype.close = function (callback) {

	if (this.server instanceof net.Server) {

		this.server.close(callback);
	}
};

Subscriber.prototype._subscribe = function (socket) {

	if (!this.channels.length) {

		return;
	}

	var chunkSize = 100;

	for (var i = 0; i < this.channels.length; i += chunkSize) {

		var chunk = this.channels.slice(i, i + chunkSize);

		socket.write('+' + chunk.join(',') + '\n');
	}
};

Subscriber.prototype._data = function (string) {

	var packets = string.split('\n');

	for (var i = 0; i < packets.length; i++) {

		var packet = {};

		try {

			packet = JSON.parse(packets[i]);

			if (!packet || !packet.channel || !packet.data) {

				console.error('Subscriber', 'InvalidData', packet);

				continue;
			}

		} catch (e) {

			console.error('Subscriber', 'DataError', packets[i], e.toString());

			continue;
		}

		this.emit('message', packet.channel, packet.data);
	}
};

module.exports.Subscriber = Subscriber;
