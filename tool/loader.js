(function() {
    var tags = document.getElementsByTagName('script');
    var tag = tags[tags.length - 1];

    var path = tag.getAttribute('src');
    path = path.substring(0, path.lastIndexOf('/') + 1);

    var index = [];

    for (var i = 0; i < index.length; ++i) {
        var src = path + index[i];

        var rpc = new XMLHttpRequest();
        rpc.open('get', src, false);
        rpc.send();

        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = src;
        script.text = rpc.responseText;

        tag.parentNode.insertBefore(script, tag);
    }
})();
