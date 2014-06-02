var Publisher = process.env.NODE_COV
	? require('./lib-cov/publisher').Publisher
	: require('./lib/publisher').Publisher;

var Subscriber = process.env.NODE_COV
	? require('./lib-cov/subscriber').Subscriber
	: require('./lib/subscriber').Subscriber;

module.exports.Publisher = Publisher;
module.exports.Subscriber = Subscriber;
