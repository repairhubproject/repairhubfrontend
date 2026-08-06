 const form = document.getElementById('repairForm');
  const modelSelect = document.getElementById('model');
  const modelError = document.getElementById('modelError');
  const serialInput = document.getElementById('serialNumber');
  const scanBtn = document.getElementById('scanBtn');

  // Scan button just gives friendly feedback (beginner-level, no real camera scan)
  scanBtn.addEventListener('click', function() {
    serialInput.value = 'SCAN' + Math.floor(Math.random() * 1000000);
    serialInput.focus();
  });

  // Form validation: require a model to be chosen before continuing
  form.addEventListener('submit', function(e) {
    e.preventDefault();

    if (modelSelect.value === '') {
      modelError.classList.remove('hidden');
      modelSelect.classList.add('border-red-400');
      modelSelect.parentElement.classList.add('shake');
      setTimeout(() => modelSelect.parentElement.classList.remove('shake'), 350);
      return;
    }

    modelError.classList.add('hidden');
    modelSelect.classList.remove('border-red-400');
    alert('Repair request created successfully!');
  });

  // this will hide the error as soon as a model is picked
  modelSelect.addEventListener('change', function() {
    if (modelSelect.value !== '') {
      modelError.classList.add('hidden');
      modelSelect.classList.remove('border-red-400');
    }
  });