var  EventEmitter = require('events').EventEmitter;

var  index = new EventEmitter();

index.run = function run(inData)  {
  var  result = {"value":
            {"list": []
            }
        };
  index.emit('done', result);
};

module.exports = index;
