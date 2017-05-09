/*
 * loads the observalbe from the global context, the global Rx variable or try to load Rx.js, fallback to core-js shim
 * The Observable can be overwritten by setting the require('baqend/realtime').Observable = Observable afterwards
 */

if (typeof Rx !== 'undefined') {
  module.exports = Rx.Observable;
} else {
  try {
    module.exports = require('rxjs/Observable').Observable;
  } catch (e) {
    if (typeof Observable == 'undefined') {
      //load Observable shim
      require('core-js/modules/es7.symbol.observable');
      require('core-js/modules/es7.observable');
      var sub = Observable.prototype.subscribe;

      //patch subscribe until core-js implements the new proposal
      //https://github.com/zloirock/core-js/issues/257
      Observable.prototype.subscribe = function(onNext, onError, onComplete) {
        if (onNext instanceof Function) {
          return sub.call(this, {
            next: onNext,
            error: onError,
            complete: onComplete
          });
        } else {
          return sub.call(this, onNext);
        }
      };
    }

    module.exports = Observable;
  }
}