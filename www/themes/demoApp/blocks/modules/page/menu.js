var  EventEmitter = require('events').EventEmitter;

var  op = new EventEmitter();

op.run = function run(inData)  {
	var  result = { "value":
						{"list":[
					         {"id":"1", "title":"option1"},
					         {"id":"2", "title":"option2"},
					         {"id":"3", "title":"option3"}
					         ]}
					};
	op.emit('done', result);
};

module.exports = op;
