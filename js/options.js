function save_options() {
  var expire = document.getElementById('expire').value;
  chrome.storage.sync.set({
    expire: expire
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
}

// Restores select box using the preferences
// stored in chrome.storage.
function restore_options() {
  // Use default value expire = '3'
  chrome.storage.sync.get({
    expire: '3'
  }, function(items) {
    document.getElementById('expire').value = items.expire;
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);