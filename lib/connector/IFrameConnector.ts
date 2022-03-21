/* this connector will only be choose in browser compatible environments */
/* eslint no-restricted-globals: ["off", "location", "addEventListener"] */

import { Connector, Receiver, Request } from './Connector';
import { XMLHttpConnector } from './XMLHttpConnector';
import { Message } from './Message';
import { JsonMap } from '../util';

export class IFrameConnector extends XMLHttpConnector {
  public static readonly style = 'width:1px;height:1px;position:absolute;top:-10px;left:-10px;';

  private mid: number;

  private messages: { [messageId: number]: Receiver };

  private iframe?: HTMLIFrameElement;

  private queue: any[] | null = null;

  private connected: boolean = false;

  /**
   * Indicates if this connector implementation is usable for the given host and port
   * @param host
   * @param port
   * @param secure
   * @return
   */
  static isUsable(host: string, port: number, secure: boolean): boolean {
    // we use location directly here, since there exists environments, which provide a location and a document but
    // no window object
    if (typeof location === 'undefined' || typeof document === 'undefined') {
      return false;
    }

    const locationSecure = location.protocol === 'https:';
    const locationPort = location.port || (locationSecure ? 443 : 80);

    return location.hostname !== host || locationPort !== port || locationSecure !== secure;
  }

  constructor(host: string, port: number, secure: boolean, basePath: string) {
    super(host, port, secure, basePath);

    this.mid = 0;
    this.messages = {};
    this.doReceive = this.doReceive.bind(this);

    addEventListener('message', this.doReceive, false);
  }

  load(message: Message) {
    const url = this.origin + this.basePath + message.path();
    const name = `baqend-sdk-connect-${Math.floor(Math.random() * 100000)}`;

    this.iframe = document.createElement('iframe');
    this.iframe.name = name;
    this.iframe.setAttribute('style', IFrameConnector.style);
    document.body.appendChild(this.iframe);

    const form = document.createElement('form');
    form.target = name;
    form.method = 'post';
    form.action = url;

    const token = message.tokenStorage()?.token;
    if (token) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'BAT';
      message.tokenStorage()!.signPath(this.basePath + message.path());
      input.value = token;
      form.appendChild(input);
    }
    document.body.appendChild(form);

    this.queue = [];
    this.iframe.addEventListener('load', this.onLoad.bind(this), false);

    form.submit();
  }

  onLoad() {
    if (!this.queue) {
      return;
    }

    const { queue } = this;

    for (let i = 0; i < queue.length; i += 1) {
      this.postMessage(queue[i]);
    }

    this.queue = null;
  }

  /**
   * @inheritDoc
   */
  doSend(message: Message, request: Request, receive: Receiver) {
    // binary data will be send and received directly
    if (message.isBinary) {
      super.doSend(message, request, receive);
      return;
    }

    if (!this.iframe) {
      this.load(message);
    }

    const msg = {
      mid: this.mid += 1,
      method: request.method,
      path: request.path,
      headers: request.headers,
      entity: request.entity,
      responseHeaders: Connector.RESPONSE_HEADERS,
    };

    this.messages[msg.mid] = receive;

    const strMsg = JSON.stringify(msg);
    if (this.queue) {
      this.queue.push(strMsg);
    } else {
      this.postMessage(strMsg);
    }

    if (!this.connected) {
      setTimeout(() => {
        if (this.messages[msg.mid]) {
          delete this.messages[msg.mid];
          receive({
            status: 0,
            error: new Error('Connection refused.'),
            headers: {},
          });
        }
      }, 10000);
    }
  }

  postMessage(msg: string) {
    this.iframe!.contentWindow!.postMessage(msg, this.origin);
  }

  doReceive(event: MessageEvent) {
    if (event.origin !== this.origin || event.data[0] !== '{') {
      return;
    }

    const msg = JSON.parse(event.data) as JsonMap;

    const receive = this.messages[msg.mid as number];
    if (receive) {
      delete this.messages[msg.mid as number];
      this.connected = true;

      receive({
        status: msg.status as number,
        headers: msg.headers as { [headerNames: string]: string },
        entity: msg.entity as any,
      });
    }
  }
}

Connector.connectors.push(IFrameConnector);
