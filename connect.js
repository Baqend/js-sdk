window.addEventListener('message', send, false);
function send(event) {
  var msg = JSON.parse(event.data);

  if (!msg.mid)
    return;

  msg.origin = event.origin;
  msg.source = event.source;

  var node = msg.method == 'GET' && document.getElementById(msg.path);
  if(!node) {
    var xhr = new XMLHttpRequest();

    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4) {
        var headers = {};
        msg.responseHeaders.forEach(function(name) {
          headers[name] = xhr.getResponseHeader(name);
        });
        receive(xhr, msg, headers);
      }
    };

    xhr.open(msg.method, msg.path, true);
    for (var name in msg.headers)
      xhr.setRequestHeader(name, msg.headers[name]);

    xhr.send(msg.entity);
  } else {
    applyCacheRule(node);
    receive({status: node.text? 200: 404, responseText: node.text}, msg, {'Content-Type': 'application/json'});
  }
}

function receive(xhr, message, headers) {
  var msg = {
    mid: message.mid,
    statusCode: xhr.status,
    headers: headers,
    entity: xhr.responseText
  };

  if (message.origin == 'null' || message.origin == 'file:')
    message.origin = '*';

  message.source.postMessage(JSON.stringify(msg), message.origin);
}

function applyCacheRule(node) {
  var cacheControl = node.getAttribute('data-cache-control');
  if(~cacheControl.indexOf('no-cache')) {
    node.parentNode.removeChild(node);
  }
}