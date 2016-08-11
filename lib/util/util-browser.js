exports.hmac = require('crypto-js/hmac-sha1');
exports.atob = window.atob;
exports.WebSocket = window.WebSocket;
exports.isNode = false;

/**
 * Checks whether the user uses google chrome.
 */
exports.isChrome = typeof window != 'undefined' && ((!!window.chrome && /google/i.test(navigator.vendor)) || (/cros i686/i.test(window.navigator.platform)));