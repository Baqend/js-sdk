var Deferred = require('q').Deferred;

/**
 * @class jspa.util.Queue
 */
exports.Queue = Queue = Object.inherit(Bind, /** @lends jspa.util.Queue.prototype */ {
  /**
   * @lends jspa.util.Queue
   */
  extend: {
    /**
     * @enum {number}
     */
    Metadata: {
      STOPPED: 0,
      PAUSED: 1,
      WAITING: 2,
      RUNNING: 3
    }
  },

  /**
   * @type Boolean
   */
  isStopped: {
    get: function () {
      return this.state == Queue.Metadata.STOPPED;
    }
  },

  /**
   * @type Boolean
   */
  isPaused: {
    get: function () {
      return this.state == Queue.Metadata.PAUSED;
    }
  },

  /**
   * @type Boolean
   */
  isWaiting: {
    get: function () {
      return this.state == Queue.Metadata.WAITING;
    }
  },

  /**
   * @type Boolean
   */
  isRunning: {
    get: function () {
      return this.state == Queue.Metadata.RUNNING;
    }
  },

  /**
   * @type Boolean
   */
  isPrevented: {
    get: function () {
      return this.prevented;
    }
  },

  initialize: function () {
    this.currentQueue = [];
    this.queue = this.currentQueue;

    this.state = Queue.Metadata.STOPPED;

    this.count = 0;
    this.prevented = false;
  },

  /**
   * @param {*} context
   * @param {jspa.Promise=} promise
   * @return {jspa.Promise}
   */
  wait: function (context, promise) {
    if (!this.isRunning && this.isPrevented)
      throw new Error("The queue was prevented");

    var deferred = new Deferred();

    var self = this;
    this.currentQueue.push(function () {
      if (promise) {
        promise.done(function () {
          var args = arguments;
          self.run(function () {
            deferred.resolveWith(context, args);
          });
        }).fail(function () {
          var args = arguments;
          self.run(function () {
            deferred.rejectWith(context, args);
          });
        });
      } else {
        self.run(function () {
          deferred.resolveWith(context);
        });
      }
    });

    this.next();

    return deferred.promise();
  },

  start: function () {
    if (this.isStopped && !this.isPrevented) {
      this.state = Queue.Metadata.PAUSED;
    }

    this.next();
  },

  /**
   * @param {Function} callback
   */
  run: function (callback) {
    if (!this.isWaiting)
      throw new Error('Illegal state ' + this.state);

    this.state = Queue.Metadata.RUNNING;

    this.currentQueue = [];

    callback();

    if (this.currentQueue.length)
      Array.prototype.unshift.apply(this.queue, this.currentQueue);

    this.currentQueue = this.queue;

    this.state = Queue.Metadata.PAUSED;

    this.next();
  },

  next: function () {
    if (this.isPaused && this.queue.length) {
      this.state = Queue.Metadata.WAITING;
      setTimeout(this.queue.shift(), 1);
    }

    if (this.isPrevented && !this.queue.length) {
      this.state = Queue.Metadata.STOPPED;
    }
  },

  stop: function () {
    this.prevented = true;
  }
});