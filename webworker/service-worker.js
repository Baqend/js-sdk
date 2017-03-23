var Bloomfilter = require('../lib/caching/BloomFilter');
var app_url = 'https://trillo.app.baqend.com/v1/bloomfilter';
var bloomFilter = {'m': 0,'h': 0,'b':''};
//get BloomFilter
fetch(app_url, { cache: 'no-store' })
  .then(
    function(response) {
      if (response.status !== 200) {
        console.log('Looks like there was a problem. Status Code: ' +
          response.status);
        return;
      }

      // Examine the text in the response
      response.json().then(function(data) {
        bloomFilter = data;
      });
    }
  )
  .catch(function(err) {
    console.log('Fetch Error :-S', err);
  });

self.addEventListener('fetch', function(event) {
  if(event.request.url.indexOf('/db/') !== -1){
    event.respondWith(
      fetch(event.request).then(function(response){
        var clonedResponse = response.clone();
        clonedResponse.json().then(function(data) {
          console.log(data);
        });
        return response;
      })
    );
  } else{
    var opt = {cache: 'default'};
    event.respondWith(
      fetch(event.request, opt).then(function(response) {
        //TODO: Implement "contains"-Method for BloomFilter
        return response;
      })
    )
  }
});

self.addEventListener('message', function(event){
  var data = event.data;
  if (data.command == "twoWayCommunication") {
    console.log("Respondingessage from the Page: ", data.message);
    event.ports[0].postMessage({
      "message": "Hi, Page"
    });
  }
});
