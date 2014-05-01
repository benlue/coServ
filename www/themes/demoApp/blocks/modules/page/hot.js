var  EventEmitter = require('events').EventEmitter;

var  hotMod = new EventEmitter();

hotMod.run = function run(inData)  {
	var  result = {
					"value": {
						"list": [{"title": "COIMOTION Is An Amazing API Service Engine."},
								 {"title": "coServ Help You Manage A Big WebSite With Ease."}
								]
					}
				  };
	hotMod.emit('done', result);
};

module.exports = hotMod;