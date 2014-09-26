(function() {
  var DB = window.DB = {
    _location: null,
    _callbacks: [],
    ready: function(cb) {
      if (!DB._location)
        DB.connect(window.location.protocol + '//' + window.location.host);

      this._callbacks.push(cb);
    },
    connect: function(location, cb) {
      if (this._location)
        throw new Error('DB already initialized.');

      this._location = location;
      window.addEventListener('message', DB._receive, false);

      var iframe = document.createElement('iframe');
      iframe.setAttribute('style', 'width:1px;height:1px;position:absolute;top:-10px;left:-10px;');
      iframe.src = this._location + '/connect';
      iframe.addEventListener('load', function() { iframe.setAttribute('data-loaded', true) }, false);
      document.body.appendChild(iframe);

      DB.ready(cb);
    },
    _receive: function(e) {
      if (e.origin == DB._location) {
        var script = document.createElement('script');
        script.text = e.data;
        document.body.appendChild(script);
        window.removeEventListener('message', DB._receive, false);
      }
    }
  };
}());
