export default function calculateStatus(
  expiryDate: string
): "valid" | "expired" | "renewal" | "unknown" {
  const today = new Date();
  const expiryDateTime = new Date(expiryDate).getTime();
  const timeDiff = expiryDateTime - today.getTime();
  const daysDiff = timeDiff / (1000 * 3600 * 24); // Convert milliseconds to days

  if (daysDiff < 0) {
    return "expired";
  } else if (daysDiff <= 30) {
    return "renewal";
  } else if (daysDiff > 30) {
    return "valid";
  }
  return "unknown";
}
