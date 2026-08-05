
export function isNewTechnician(createdAt) {
    const createdDate = new Date(createdAt);
    const today = new Date();

    // Difference in milliseconds
    const difference = today - createdDate;

    // Convert milliseconds to days
    const days = difference / (1000 * 60 * 60 * 24);

    return days <= 30;
}