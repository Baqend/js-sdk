if (!Object.inherit)
	require('jahcode');

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
	