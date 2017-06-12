require([
  'scripts/mustache.min.js',
  'scripts/lunr.min.js',
  'text!search-results-template.mustache',
  'text!search_index.json',
], function (Mustache, lunr, results_template, data) {
  "use strict";

  var base_url = 'https://www.baqend.com/guide';

  function getSearchTerm() {
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++) {
      var sParameterName = sURLVariables[i].split('=');
      if (sParameterName[0] == 'q') {
        return decodeURIComponent(sParameterName[1].replace(/\+/g, '%20'));
      }
    }
  }

  var index = lunr(function () {
    this.field('title', { boost: 10 });
    this.field('text');
    this.ref('location');
  });

  data = JSON.parse(data);
  var documents = {};

  for (var i = 0; i < data.docs.length; i++) {
    var doc = data.docs[i];
    doc.location = base_url + doc.location;
    index.add(doc);
    documents[doc.location] = doc;
  }

  var $results = document.getElementById('search-results');

  var search = function () {
    var query = document.getElementById('search-query').value;

    // Fix search query to match our spelling…
    query = query.replace(/(\w+)time\b/gi, '$1 time');
    query = query.replace(/(\w+)aware\b/gi, '$1 aware');

    while ($results.firstChild) {
      $results.removeChild($results.firstChild);
    }

    if (query === '') {
      $results.insertAdjacentHTML('beforeend', '<p class="search-no-results">Please enter a search query ...</p>');
      return;
    }

    var results = index.search(query);

    if (results.length > 0) {
      for (var i = 0; i < results.length; i++) {
        var result = results[i];
        doc = documents[result.ref];
        doc.base_url = base_url;
        doc.summary = doc.text.substring(0, 200);
        var html = Mustache.to_html(results_template, doc);
        $results.insertAdjacentHTML('beforeend', html);
      }
    } else {
      $results.insertAdjacentHTML('beforeend', '<p class="search-no-results">No results found for “' + query + '”</p>');
    }
  };

  var $searchInput = document.getElementById('search-query');

  var term = getSearchTerm();
  if (term) {
    $searchInput.value = term;
    search();
  }

  $searchInput.addEventListener('mouseover', function () {
    $searchInput.focus();
  });

  $searchInput.addEventListener('keyup', function (event) {
    // Focus first result on arrow down
    if (event.key === 'ArrowDown') {
      var firstResult = $results.getElementsByTagName('a').item(0);
      if (firstResult) {
        firstResult.focus();
        event.preventDefault();
      }
      return;
    }

    search();
  });

  // Switch focus between results with arrow keys
  $results.addEventListener('keydown', function (event) {
    var active = document.activeElement;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      var nodes = $results.getElementsByTagName('a');
      var activeIndex = -1;
      for (var i = 0; i < nodes.length; i += 1) {
        if (active == nodes.item(i)) {
          activeIndex = i;
          break;
        }
      }

      if (activeIndex == -1) {
        return;
      }

      event.preventDefault();
      var next = event.key === 'ArrowDown' ? Math.min(nodes.length - 1, activeIndex + 1) : Math.max(0, activeIndex - 1);
      nodes.item(next).focus();
    }
  })
});
