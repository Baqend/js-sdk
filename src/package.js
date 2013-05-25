if (!Object.inherit)
	require('../lib/jahcode.js');

if (typeof util === 'undefined')
	var util = require('../lib/util.js');

var jspa = {
	error: {},
	connector: {},
	metamodel: {},
	message: {},
	util: {},
	binding: {},
	collection: {}
};

if (typeof module !== 'undefined')
	module.exports = jspa;
	