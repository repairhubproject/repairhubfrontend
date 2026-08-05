
export function formatTimeAgo(dateString) {
  // Convert the date string to a Date object
  const requestDate = new Date(dateString);

  // Get the current date and time
  const currentDate = new Date();

  // Find the difference in milliseconds
  const difference =
    currentDate - requestDate;

  // Convert milliseconds to seconds
  const seconds =
    Math.floor(difference / 1000);

  // Less than one minute
  if (seconds < 60) {
    return "Just now";
  }

  // Convert seconds to minutes
  const minutes =
    Math.floor(seconds / 60);

  // Less than one hour
  if (minutes < 60) {
    return `${minutes} ${
      minutes === 1
        ? "minute"
        : "minutes"
    } ago`;
  }

  // Convert seconds to hours
  const hours =
    Math.floor(seconds / 3600);

  // Less than one day
  if (hours < 24) {
    return `${hours} ${
      hours === 1
        ? "hour"
        : "hours"
    } ago`;
  }

  // Convert seconds to days
  const days =
    Math.floor(seconds / 86400);

  // Less than one week
  if (days < 7) {
    return `${days} ${
      days === 1
        ? "day"
        : "days"
    } ago`;
  }

  // Convert days to weeks
  const weeks =
    Math.floor(days / 7);

  // Less than one month
  if (weeks < 4) {
    return `${weeks} ${
      weeks === 1
        ? "week"
        : "weeks"
    } ago`;
  }

  // Convert days to months
  const months =
    Math.floor(days / 30);

  // Less than one year
  if (months < 12) {
    return `${months} ${
      months === 1
        ? "month"
        : "months"
    } ago`;
  }

  // Convert days to years
  const years =
    Math.floor(days / 365);

  return `${years} ${
    years === 1
      ? "year"
      : "years"
  } ago`;
}


export function timeAgo(createdAt) {
    const postedDate = new Date(createdAt);
    const currentDate = new Date();

    const differenceInMilliseconds = currentDate - postedDate;

    const differenceInSeconds = Math.floor(
        differenceInMilliseconds / 1000
    );

    if (differenceInSeconds < 60) {
        return `${differenceInSeconds}s ago`;
    }

    const differenceInMinutes = Math.floor(
        differenceInSeconds / 60
    );

    if (differenceInMinutes < 60) {
        return `${differenceInMinutes}m ago`;
    }

    const differenceInHours = Math.floor(
        differenceInMinutes / 60
    );

    if (differenceInHours < 24) {
        return `${differenceInHours}h ago`;
    }

    const differenceInDays = Math.floor(
        differenceInHours / 24
    );

    if (differenceInDays < 7) {
        return `${differenceInDays}d ago`;
    }

    const differenceInWeeks = Math.floor(
        differenceInDays / 7
    );

    if (differenceInWeeks < 4) {
        return `${differenceInWeeks}w ago`;
    }

    const differenceInMonths = Math.floor(
        differenceInDays / 30
    );

    if (differenceInMonths < 12) {
        return `${differenceInMonths}mo ago`;
    }

    const differenceInYears = Math.floor(
        differenceInDays / 365
    );

    return `${differenceInYears}y ago`;
}