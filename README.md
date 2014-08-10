pub-sub-js [![](https://travis-ci.org/x25/pub-sub-js.png)](https://travis-ci.org/x25/pub-sub-js) [![](https://coveralls.io/repos/x25/pub-sub-js/badge.png)](https://coveralls.io/r/x25/pub-sub-js)
==========
**pub-sub-js** is tiny library with zero dependencies that implements distributed publish/subscribe messaging system.

```bash
$ npm install pub-sub-js
```

Why not use zeromq ? Because of this [bug](https://github.com/JustinTulloss/zeromq.node/issues/272).

## Usage

Publish messages to channels:

```js
var Pub = require('pub-sub-js').Publisher;

var publisher = new Pub();

publisher.listen(8002);

setInterval(function () {

  publisher.publish('channel_one', 'message_one');
  publisher.publish('channel_two', {message: 'two'});
  publisher.publish('channel_three', ['message', 'three']);

}, 1000);
```

Subscribe to channels and receive the messages:

```js
var Sub = require('pub-sub-js').Subscriber;

var subscriber = new Sub();

subscriber.subscribe('channel_one');
subscriber.connect(8002, '127.0.0.1');
subscriber.subscribe('channel_two');

subscriber.on('message', function (channel, data) {

  console.log(channel, data);
});
```

Output:

```
channel_one message_one
channel_two { message: 'two' }
```

Message three will not be received because there is no subscription to the channel_three. There will be **no network traffic** on publisher.send('channel_three', ...) call.

## API

###Class: Subscriber

**.subscribe(channel)**

Subscribes to the channel.

**.unsubscribe(channel)**

Unsubscribes from the channel.

**.connect(port, [host])**

Opens connection to the Publisher. See [net.Socket.connect()][node-api-net].

**.disconnect(port, [host])**

Closes the connection.

**.listen(port, [host])**

Begin accepting connections on the specified port and hostname. See [net.Server.listen()][node-api-net].

**.close([callback])**

Stops from accepting new connections. See [net.Server.close()][node-api-net].

**Event: 'message' (channel, data)**

Emitted when the message is received.

**Event: 'log' (args)**

Can be used for debugging.

###Class: Publisher

**.publish(channel, message)**

Publish message to the channel.

**.connect(port, [host])**

Opens connection to the Subscriber. See [net.Socket.connect()][node-api-net].

**.disconnect(port, [host])**

Closes the connection.

**.listen(port, [host])**

Begin accepting connections on the specified port and hostname. See [net.Server.listen()][node-api-net].

**.close([callback])**

Stops from accepting new connections. See [net.Server.close()][node-api-net].

**Event: 'log' (args)**

Can be used for debugging.

## Tests

```sh
$ npm test
```

## License

MIT

[node-api-net]: http://nodejs.org/api/net.html
