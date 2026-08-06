// Highlight the clicked nav item
const navItems = document.querySelectorAll('.nav-item');
navItems.forEach(item => {
  item.addEventListener('click', function(e) {
    if (this.id === 'logoutBtn') return; // logout handled separately below
    e.preventDefault();
    navItems.forEach(i => {
      i.classList.remove('bg-blue-400', 'text-white', 'font-medium');
      i.classList.add('text-gray-600');
    });
    this.classList.remove('text-gray-600');
    this.classList.add('bg-blue-400', 'text-white', 'font-medium');
  });
});

// Logout confirmation
document.getElementById('logoutBtn').addEventListener('click', function(e) {
  e.preventDefault();
  alert('You have been logged out.');
});

// Back arrow - simple navigation feedback
document.getElementById('backBtn').addEventListener('click', function() {
  alert('Going back to Technician step...');
});

// Notification bell
document.getElementById('notifBtn').addEventListener('click', function() {
  alert('No new notifications.');
});

// Message technician
document.getElementById('messageBtn').addEventListener('click', function() {
  alert('Opening chat with Davine Johnson...');
});

// Call technician
document.getElementById('callBtn').addEventListener('click', function() {
  alert('Calling Davine Johnson...');
});

// Edit home address
document.getElementById('editAddressBtn').addEventListener('click', function() {
  const newAddress = prompt('Edit your home address:', '23 Bodija Road, Ibadan, Oyo State.');
  if (newAddress) {
    this.closest('.flex.items-start').querySelector('p.text-gray-500').textContent = newAddress;
  }
});

// Proceed to payment
document.getElementById('proceedBtn').addEventListener('click', function() {
  const total = document.getElementById('totalAmount').textContent;
  alert('Proceeding to payment for a total of ' + total);
});