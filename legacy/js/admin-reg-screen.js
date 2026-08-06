// this will get all the role selection cards (Customer, Technician, Admin)
const roleCards = document.querySelectorAll('[data-role]');

roleCards.forEach(card => {
  card.addEventListener('click', function() {
    const role = this.getAttribute('data-role');

    if (role === 'customer') {
      alert('Continuing as Customer...');
      // window.location.href = "../customer/dashboard.html";
    } else if (role === 'technician') {
      alert('Continuing as Technician...');
      // window.location.href = "../technician/dashboard.html";
    } else if (role === 'admin') {
      alert('Redirecting to Admin Login...');
      // window.location.href = "../admin/login.html";
    }
  });
});

// "Learn more about roles" link
document.getElementById('learnMoreLink').addEventListener('click', function(e) {
  e.preventDefault();
  alert('Customers book repairs, Technicians fulfil repair jobs, and Admins manage the whole platform.');
});