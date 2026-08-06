 // Highlight the clicked nav item
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      navItems.forEach(i => {
        i.classList.remove('bg-blue-400', 'text-white', 'font-medium');
        i.classList.add('text-gray-600');
      });
      this.classList.remove('text-gray-600');
      this.classList.add('bg-blue-400', 'text-white', 'font-medium');
    });
  });

  //  logout confirmation
  document.getElementById('logoutBtn').addEventListener('click', function(e) {
    e.preventDefault();
    alert('You have been logged out.');
  });

  // Collapse sidebar button (just a visual toggle for)
  document.getElementById('collapseBtn').addEventListener('click', function() {
    alert('Sidebar collapse clicked!');
  });

  // Notification bell simple click feedback
  document.getElementById('notifBtn').addEventListener('click', function() {
    alert('No new notifications.');
  });

  // Next arrow at bottom right - alert
  document.getElementById('nextBtn').addEventListener('click', function() {
    alert('Going to next device...');
  });