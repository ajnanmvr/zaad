export default function calculateDaysLeft(expiryDate: string | null | undefined): number | null {
  if (!expiryDate) {
    return null;
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiryDateTime = new Date(expiryDate);
    expiryDateTime.setHours(0, 0, 0, 0);

    const timeDiff = expiryDateTime.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    return daysDiff;
  } catch (error) {
    console.error("Error calculating days left:", error);
    return null;
  }
}
