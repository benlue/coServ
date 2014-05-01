/*!
 * coServ
 * authors: Ben Lue
 * license: MIT
 * Copyright(c) 2014 Gocharm Inc.
 */
var  EventEmitter = require('events').EventEmitter;

var  WebMod = new EventEmitter();

WebMod.run = function run(inData)  {
	//var  result = {};
	//WebMod.emit('done', result);
};


WebMod.setDone = function setDone(result)  {
	WebMod.emit('done', result);
};

module.exports = WebMod;