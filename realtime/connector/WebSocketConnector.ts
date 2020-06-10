'use strict';

import { CommunicationError } from "../../lib/error";
import { WebSocket } from "./websocket";
import { Observable } from "rxjs";
import { Json } from "../../lib/util";

export interface ObservableStream extends Observable<ChannelMessage> {
  /**
   * Sends a message through the websocket channel
   * @param message - The message to send
   */
  send(message: Json): void;
}

export type ChannelMessage = {
  /**
   * The unique channel id of the message
   */
  id: string;

  /**
   * The message type
   */
  type: string;

  /**
   * server-time from the instant at which the event was generated
   */
  date: Date;
}

export class WebSocketConnector {
  /**
   * Map of all available connectors to their respective websocket connections
   * @type Connector[]
   */
  private static websockets: { [origin: string]: WebSocketConnector } = {};

  private observers: {};
  private socket: WebSocket;
  private url: string;

  /**
   * @param {String=} url The websocket connect script url
   * @return {WebSocketConnector} a websocket connection
   */
  static create(url) {
    let websocket = this.websockets[url];
    if (!websocket) {
      websocket = new WebSocketConnector(url);
      this.websockets[url] = websocket;
    }
    return websocket;
  }

  /**
   * @param {String} url
   */
  constructor(url) {
    this.observers = {};
    this.socket = null;
    this.url = url;
  }

  open() {
    if (!this.socket) {
      const socket = new WebSocket(this.url);
      let socketPromise;

      const handleSocketCompletion = (error) => {
        // observable error calls can throw an exception therefore cleanup beforehand
        let isError = false;
        if (this.socket === socketPromise) {
          isError = socket.readyState !== 3;
          this.socket = null;
        }

        let firstErr;
        Object.keys(this.observers).forEach((id) => {
          const observer = this.observers[id];
          delete this.observers[id]; // unsubscribe to allow re subscriptions
          if (!observer) {
            return;
          }
          try {
            if (isError) {
              observer.error(new CommunicationError(null, error));
            } else {
              observer.complete();
            }
          } catch (e) {
            if (!firstErr) {
              firstErr = e;
            }
          }
        });

        if (firstErr) { throw firstErr; }
      };

      socket.onerror = handleSocketCompletion;
      socket.onclose = handleSocketCompletion;
      socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        message.date = new Date(message.date);

        const id = message.id;
        if (!id) {
          if (message.type === 'error') { handleSocketCompletion(message); }
          return;
        }

        const observer = this.observers[id];
        if (observer) {
          if (message.type === 'error') {
            observer.error(new CommunicationError(null, message));
          } else {
            observer.next(message);
          }
        }
      };

      socketPromise = new Promise((resolve) => {
        socket.onopen = resolve;
      }).then(() => socket);

      this.socket = socketPromise;
    }

    return this.socket;
  }

  close() {
    if (this.socket) {
      this.socket.then((socket) => {
        socket.close();
      });
      this.socket = null;
    }
  }

  /**
   * @param {TokenStorage} tokenStorage
   * @param {string} id subscription ID
   * @return {connector.ObservableStream} The channel for sending and receiving messages
   */
  openStream(tokenStorage, id) {
    const stream = new Observable((observer) => {
      if (this.observers[id]) { throw new Error('Only one subscription per stream is allowed.'); }

      this.observers[id] = observer;
      return () => {
        // cleanup only our subscription and handle re subscription on the same stream id correctly
        if (this.observers[id] === observer) { delete this.observers[id]; }
      };
    });
    
    Object.assign(stream, {
      send: (message) => {
        this.open().then((socket) => {
          message.id = id;
          if (tokenStorage.token) { message.token = tokenStorage.token; }
          const jsonMessage = JSON.stringify(message);
          socket.send(jsonMessage);
        });
      }
    })

    return stream as ObservableStream;
  }
}
