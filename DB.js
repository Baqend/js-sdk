(function() {
  var loc = 'https://local.baqend.com:8143';

  var cbs = [];
  window.DB = {
    ready: function(cb) {
      cbs.push(cb);
    }
  };

  function receive(e) {
    if (e.origin == loc) {
      var script = document.createElement('script');
      script.text = e.data;
      document.body.appendChild(script);
      window.removeEventListener('message', receive, false);

      for (var i = 0; i < cbs.length; ++i)
        cbs[i]();
    }
  }

  window.addEventListener('message', receive, false);

  var iframe = window.DB.connection = document.createElement('iframe');
  iframe.style = 'width:1px;height:1px;position:absolute;top:-10px;left:-10px';
  iframe.src = loc + '/connect';
  document.body.appendChild(iframe);
}());
