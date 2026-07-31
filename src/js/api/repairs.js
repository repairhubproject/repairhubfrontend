const statusFilter = document.getElementById('statusFilter');
const priorityFilter = document.getElementById('priorityFilter');
const clearFilters = document.getElementById('clearFilters');
const repairRows = document.querySelectorAll('.repair-row');

function applyFilters() {
  const status = statusFilter.value;
  const priority = priorityFilter.value;
  repairRows.forEach(row => {
    const matchStatus = status === 'all' || row.dataset.status === status;
    const matchPriority = priority === 'all' || row.dataset.priority === priority;
    row.style.display = (matchStatus && matchPriority) ? '' : 'none';
  });
}

statusFilter.addEventListener('change', applyFilters);
priorityFilter.addEventListener('change', applyFilters);
clearFilters.addEventListener('click', () => {
  statusFilter.value = 'all';
  priorityFilter.value = 'all';
  applyFilters();
});