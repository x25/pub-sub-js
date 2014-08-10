var Parser = require('../lib/parser').Parser;
var PubSub = require('../');

module.exports = {
	setUp: function (callback) {

		callback();
	},

	tearDown: function (callback) {
		// clean up
		callback();
	},

	testParser: function (test) {

		test.expect(4);

		var n = 1;

		var parser = new Parser('\n', function (chunk) {

			switch(n)
			{
				case 1:

					test.equal('chunk1', chunk);

					break;

				case 2:

					test.equal('chunk2', chunk);

					break;

				default:

					test.ok(false);
			}

			n++;
		});

		parser.add('chunk1\nchunk2');

		test.equals(2, n);

		parser.add('\nchunk3');

		test.equals('chunk3', parser.buffer);

		test.done();
	},

	testSubToPub: function (test) {

		test.expect(5);

		var publisher = new PubSub.Publisher();

		var subscriber = new PubSub.Subscriber();

		publisher.listen(8002);

		setTimeout(function () {

			publisher.publish('channel_one', 'message_one');

			publisher.publish('channel_two', {message: 'two'});

			publisher.publish('channel_three', ['message', 'three']);

		}, 1000);

		subscriber.subscribe('channel_one');

		subscriber.subscribe('channel_two');

		subscriber.connect(8002, '127.0.0.1');

		subscriber.connect(8002, '127.0.0.1');

		subscriber.connect(8003, '127.0.0.1');

		subscriber.subscribe('channel_one');

		try {

			subscriber.subscribe('a\nb');

		} catch (e) {

			test.ok(true);
		}

		var n = 1;

		subscriber.on('message', function (channel, data) {

			switch(n)
			{
				case 1:

					test.equal('channel_one', channel);

					test.equal('message_one', data);

					break;

				case 2:

					test.equal('channel_two', channel);

					test.deepEqual({message: 'two'}, data);

					break;

				default:

					test.ok(false);
			}

			n++;
		});

		setTimeout(function () {

			subscriber.unsubscribe('channel_one');

			subscriber.unsubscribe('channel_two');

			subscriber.unsubscribe('channel_two');

			subscriber.unsubscribe('channel_x');

			subscriber.disconnect(8002, '127.0.0.1');

			subscriber.disconnect(8003, '127.0.0.1');

			publisher.close();

			setTimeout(function () {

				test.done();

			}, 2000);

		}, 2000);
	},

	testPubToSub: function (test) {

		test.expect(4);

		var publisher = new PubSub.Publisher();

		var subscriber = new PubSub.Subscriber();

		publisher.connect(8002, '127.0.0.1');

		publisher.connect(8002, '127.0.0.1');

		publisher.connect(8003, '127.0.0.1');

		setTimeout(function () {

			publisher.publish('channel_one', 'message_one');

			publisher.publish('channel_two', {message: 'two'});

			publisher.publish('channel_three', ['message', 'three']);

		}, 1000);

		subscriber.subscribe('channel_one');

		subscriber.listen(8002);

		subscriber.subscribe('channel_two');

		var n = 1;

		subscriber.on('message', function (channel, data) {

			switch(n)
			{
				case 1:

					test.equal('channel_one', channel);

					test.equal('message_one', data);

					break;

				case 2:

					test.equal('channel_two', channel);

					test.deepEqual({message: 'two'}, data);

					break;

				default:

					test.ok(false);
			}

			n++;
		});

		setTimeout(function () {

			subscriber.unsubscribe('channel_one');

			subscriber.unsubscribe('channel_two');

			subscriber.unsubscribe('channel_undefined');

			publisher.disconnect(8002, '127.0.0.1');

			publisher.disconnect(8003, '127.0.0.1');

			subscriber.close();

			setTimeout(function () {

				test.done();

			}, 2000);

		}, 2000);
	}
};
