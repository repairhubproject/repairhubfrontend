
export function getStatusClass(status) {
  const statusClasses = {
    open: `
      bg-green-100
      text-green-700
      border
      border-green-500
    `,

    cancelled: `
      bg-red-100
      text-red-700
      border
      border-red-500
    `,

    booked: `
      bg-blue-100
      text-blue-700
      border
      border-blue-500
    `,
  };

  return (
    statusClasses[status.toLowerCase()] ||
    `
      bg-gray-100
      text-gray-700
      border
      border-gray-400
    `
  );
}

export function formatStatus(status) {
  return (
    status.charAt(0).toUpperCase() +
    status.slice(1)
  );
}