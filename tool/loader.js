var tags = document.getElementsByTagName('script');
var tag = tags[tags.length - 1];

var path = tag.getAttribute('src');
path = path.substring(0, path.lastIndexOf('/') + 1);

var index = [];

for (var i = 0; i < index.length; ++i) {
    var script = document.createElement('script');
    script.setAttribute('type', 'text/javascript');
    script.setAttribute('src', path + index[i]);
    tag.parentNode.insertBefore(script, tag);
}