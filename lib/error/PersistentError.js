"use strict";
/**
 * @class baqend.error.PersistentError
 * @extends Error
 *
 * @param {String} message
 * @param {Error=} cause
 */
class PersistentError extends Error {
    static of(e) {
        if (e instanceof PersistentError)
            return e;

        return new PersistentError(null, e);
    }

    constructor(message, cause) {
        super(message ? message : 'baqend.error.PersistentError: An unexpected persistent error occured. ' + cause ? cause.message : '');

        if (cause) {
            this.cause = cause;
            if (cause.stack) {
                this.stack += '\nCaused By: ' + cause.stack;
            }
        }
    }
}

module.exports = PersistentError;