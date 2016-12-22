window.addEventListener('message', send, false);
var basePath = location.pathname.substring(0, location.pathname.lastIndexOf('/'));
function send(event) {
  var msg = JSON.parse(event.data);

  if (!msg.mid)
    return;

  msg.origin = event.origin;
  msg.source = event.source;

  if (msg.method == 'OAUTH') {
    return handleOAuth(msg);
  }

  var node = msg.method == 'GET' && document.getElementById(msg.path);
  if(!node) {
    var xhr = new XMLHttpRequest();

    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4) {
        var headers = {};
        msg.responseHeaders.forEach(function(name) {
          headers[name] = xhr.getResponseHeader(name);
        });
        receive(msg, xhr.status, headers, xhr.responseText);
      }
    };

    xhr.open(msg.method, basePath + msg.path, true);
    for (var name in msg.headers)
      xhr.setRequestHeader(name, msg.headers[name]);

    xhr.send(msg.entity);
  } else {
    applyCacheRule(node);
    receive(msg, node.text? 200: 404, getHeaders(node), node.text);
  }
}

function receive(message, status, headers, entity) {
  var response = {
    mid: message.mid,
    status: status,
    headers: headers,
    entity: entity
  };

  if (message.origin == 'null' || message.origin == 'file:')
    message.origin = '*';

  message.source.postMessage(JSON.stringify(response), message.origin);
}

function applyCacheRule(node) {
  var cacheControl = node.getAttribute('data-cache-control');
  if(~cacheControl.indexOf('no-cache')) {
    node.parentNode.removeChild(node);
  }
}

function getHeaders(node) {
  var headers = {'Content-Type': 'application/json'};
  var token = node.getAttribute('data-token');
  if (token)
    headers['baqend-authorization-token'] = token;
  return headers;
}

var oAuthHandle, oAuthInterval;
function handleOAuth(msg) {
  if (oAuthHandle)
    oAuthHandle(409, {}, '{"message": "A new OAuth request was sent."}');

  localStorage.removeItem('oauth-response');

  var handler = function(event) {
    if (event.key == 'oauth-response') {
      var response = JSON.parse(event.newValue);
      oAuthHandle(response.status, response.headers, response.entity);
    }
  };

  oAuthHandle = function(status, headers, entity) {
    receive(msg, status, headers, entity);
    localStorage.removeItem('oauth-response');
    removeEventListener("storage", handler, false);
    clearTimeout(oAuthInterval);
  };

  addEventListener("storage", handler, false);
  oAuthInterval = setInterval(function() {
    var item = localStorage.getItem('oauth-response');
    if (item) {
      handler({key: 'oauth-response', newValue: item})
    }
  }, 500);
}