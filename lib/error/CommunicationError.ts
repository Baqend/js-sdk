'use strict';

import { PersistentError } from "./PersistentError";
import { Json } from "../util/Json";
import { Message } from "../connector/Message";
import { Response } from "../connector/Connector";

export class CommunicationError extends PersistentError {
  /**
   * The reason of the error
   */
  public reason: string;

  /**
   * The error response status code of this error
   */
  public status: number;

  /**
   * Additional Data to keep with the error
   */
  public data?: Json;

  /**
   * @param httpMessage The http message which was send
   * @param response The received entity headers and content
   */
  constructor(httpMessage: Message | null, response: Response) {
    const entity = response.entity || response.error || {};
    const state = (response.status === 0 ? 'Request' : 'Response');
    const message = entity.message
        || (httpMessage && 'Handling the ' + state + ' for ' + httpMessage.request.method + ' ' + httpMessage.request.path)
        || 'A communication error occurred.'

    super(message, entity);

    this.name = entity.className || 'CommunicationError';
    this.reason = entity.reason || 'Communication failed';
    this.status = response.status;

    if (entity.data) {
      this.data = entity.data;
    }

    let cause = entity;
    while (cause && cause.stackTrace) {
      this.stack += '\nServerside Caused by: ' + cause.className + ' ' + cause.message;

      const stackTrace = cause.stackTrace;
      for (let i = 0; i < stackTrace.length; i += 1) {
        const el = stackTrace[i];

        this.stack += '\n    at ' + el.className + '.' + el.methodName;
        this.stack += ' (' + el.fileName + ':' + el.lineNumber + ')';
      }

      cause = cause.cause;
    }
  }
}
