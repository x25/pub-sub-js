pub-sub-js
==========
A tiny library that implements distributed publish/subscribe messaging system.

```bash
$ npm install pub-sub-js
```

## Usage

Publish messages to channels:

```js
var Pub = require('pub-sub-js').Publisher;

var publisher = new Pub;

publisher.listen(8002);

setInterval(function () {
  publisher.publish('channel_one', 'message_one');
  publisher.publish('channel_two', {message: 'two'});
  publisher.publish('channel_three', ['message', 'three']);
}, 1000);
```

Subscribe to channels and receive messages:

```js
var Sub = require('pub-sub-js').Subscriber;

var subscriber = new Sub;

subscriber.subscribe('channel_one');
subscriber.connect(8002, '127.0.0.1');
subscriber.subscribe('channel_two');

subscriber.on('message', function (channel, data) {
  console.log(channel, data);
});
```

Subscriber output:

```
channel_one message_one
channel_two { message: 'two' }
```

Message three will not be received, as there is no subscription on channel three. There will be **no network traffic** on publisher.send('channel_three', ...) call.

## API

### Subscriber

**subscribe(channel)**

**unsubscribe(channel)**

**connect(port, host)**

**disconnect(port, host)**

**listen(port, host)**

**close()**

### Publisher

**publish(channel, data)**

**connect(port, host)**

**disconnect(port, host)**

**listen(port, host)**

**close()**

More info comming soon...
