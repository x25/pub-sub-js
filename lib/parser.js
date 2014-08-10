function Parser(separator, callback) {

	this.buffer = '';
    this.separator = separator;
    this.callback = callback;
}

Parser.prototype.add = function (string) {

    this.buffer += string;

    var chunks = this.buffer.split(this.separator);

    for (var i = 0; i < chunks.length - 1; i++) {

        this.callback(chunks[i]);
	}

    this.buffer = chunks[chunks.length - 1];
};

module.exports.Parser = Parser;
