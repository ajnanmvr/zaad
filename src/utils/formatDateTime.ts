export default function formatDateTime(date: Date | string | null): string {
  if (!date) return "---";

  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    return "---";
  }

  return parsedDate.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}
