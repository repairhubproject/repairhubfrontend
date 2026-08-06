// src/js/pages/technician/business-details.js

document.addEventListener('DOMContentLoaded', () => {
    const menuBtn = document.getElementById('menuBtn');
    const sidebar = document.getElementById('sidebar');
    menuBtn?.addEventListener('click', () => sidebar.classList.toggle('hidden'));
  
    // Logo upload preview
    const logoInput = document.getElementById('logoInput');
    const logoPreview = document.getElementById('logoPreview');
    const logoPlaceholderIcon = document.getElementById('logoPlaceholderIcon');
  
    logoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        logoPreview.src = event.target.result;
        logoPreview.classList.remove('hidden');
        logoPlaceholderIcon.classList.add('hidden');
      };
      reader.readAsDataURL(file);
    });
  
    // Service radius live value
    const serviceRadius = document.getElementById('serviceRadius');
    const serviceRadiusValue = document.getElementById('serviceRadiusValue');
    serviceRadius.addEventListener('input', () => {
      serviceRadiusValue.textContent = `${serviceRadius.value} km`;
    });
  
    // Specialization tags
    const specializationTags = document.getElementById('specializationTags');
    const addSpecializationInput = document.getElementById('addSpecializationInput');
  
    function addTag(text) {
      const tag = document.createElement('span');
      tag.className = 'tag flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full';
      tag.innerHTML = `${text} <button type="button" class="remove-tag text-blue-700 hover:text-blue-900">&times;</button>`;
      specializationTags.appendChild(tag);
    }
  
    addSpecializationInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && addSpecializationInput.value.trim()) {
        e.preventDefault();
        addTag(addSpecializationInput.value.trim());
        addSpecializationInput.value = '';
      }
    });
  
    specializationTags.addEventListener('click', (e) => {
      if (e.target.classList.contains('remove-tag')) {
        e.target.closest('.tag').remove();
      }
    });
  
    // Form submit
    const form = document.getElementById('businessDetailsForm');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
  
      const specializations = Array.from(specializationTags.querySelectorAll('.tag'))
        .map(tag => tag.firstChild.textContent.trim());
  
      const payload = {
        businessName: document.getElementById('businessName').value,
        serviceRadius: serviceRadius.value,
        specializations,
        instantBookings: document.getElementById('instantBookingsToggle').checked
      };
  
      // TODO: replace with real API call, e.g.
      // await fetch('/api/technician/business-details', { method: 'PUT', body: JSON.stringify(payload) });
      console.log('Saving business details:', payload);
    });
  });