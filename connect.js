var source = window.parent;

source.postMessage(document.getElementById('sdk').text, '*');

window.addEventListener('message', send, false);
function send(event) {
  var msg = JSON.parse(event.data);

  if (!msg.cid)
    return;

  var xhr = new XMLHttpRequest();
  msg.origin = event.origin;

  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4) {
      receive(xhr, msg);
    }
  };

  xhr.open(msg.method, msg.path, true);
  for (var name in msg.headers)
    xhr.setRequestHeader(name, msg.headers[name]);

  xhr.send(msg.entity);
}

function receive(xhr, message) {
  var headers = {};

  message.responseHeaders.forEach(function(name) {
    headers[name] = xhr.getResponseHeader(name);
  });

  var msg = {
    cid: message.cid,
    mid: message.mid,
    statusCode: xhr.status,
    headers: headers,
    entity: xhr.responseText
  };

  source.postMessage(message.cid  + ':' +  JSON.stringify(msg), message.origin);
}