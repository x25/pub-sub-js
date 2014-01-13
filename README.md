pub-sub-js
==========
A tiny library that implements distributed publish/subscribe messaging system.

```bash
$ npm install pub-sub-js
```

## Usage

Publish messages:

```js
var Pub = require('pub-sub-js').Publisher;

var publisher = new Pub;

publisher.listen(8002);

setInterval(function () {
  publisher.send('channel_one', 'data_str');
  publisher.send('channel_two', {'data':'object'});
}, 1000);
```

Subscribe to channels and receive messages:

```js
var Sub =  require('pub-sub-js').Subscriber;

var subscriber = new Sub;

subscriber.subscribe('channel_one');
subscriber.connect(8002, '127.0.0.1');
subscriber.subscribe('channel_two');

subscriber.on('message', function (channel, data) {
  console.log(channel, data);
});
```

Output:

```
channel_one data_str
channel_two { data: 'object' }
```


## API

Comming soon...
