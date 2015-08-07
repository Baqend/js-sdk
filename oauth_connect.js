window.addEventListener('load', save, false);
function save(event) {
  localStorage.setItem('storage-oauth-event', user);
  window.close();
}
