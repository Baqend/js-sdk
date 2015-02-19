(function() {
  var nav = document.querySelector('nav');
  var filter = nav.querySelector('.filter');
  var openables = nav.querySelectorAll('ul > li:not(.opened)');

  filter.addEventListener('keyup', function() {
    var str = filter.value.toLowerCase();

    for (var i = 0, openable; openable = openables[i]; i++) {
      if (str) {
        openable.classList.add('opened');
      } else {
        openable.classList.remove('opened');
      }
    }

    var lis = nav.querySelectorAll('li');
    loop: for (var i = 0, li; li = lis[i]; i++) {
      if (str) {
        var names = li.querySelectorAll('.name');
        for (var j = 0, name; name = names[j]; j++) {
          if (name.innerText.toLowerCase().indexOf(str) != -1) {
            li.style.display = 'block';
            continue loop;
          }
        }

        li.style.display = 'none';
      } else {
        li.style.display = 'block';
      }
    }
  }, false);

}());
