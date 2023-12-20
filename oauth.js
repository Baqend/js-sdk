window.addEventListener('load', function() {
  localStorage.setItem('oauth-response', JSON.stringify(response));
  window.close();
}, false);
