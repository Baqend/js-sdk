window.addEventListener('message', send, false);
function send(event) {
  var msg = JSON.parse(event.data);

  if (!msg.mid)
    return;

  msg.origin = event.origin;
  msg.source = event.source;

  if (msg.method == 'OAUTH') {
    addEventListener("storage", function handle(event) {
      if (event.key == 'oauth-response') {
        var response = JSON.parse(event.newValue);
        receive(msg, response.status, response.headers, response.entity);
        localStorage.removeItem('oauth-response');
        removeEventListener("storage", handle, false);
      }
    }, false);
    return;
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

    xhr.open(msg.method, msg.path, true);
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
    headers['orestes-authorization-token'] = token;
  return headers;
}