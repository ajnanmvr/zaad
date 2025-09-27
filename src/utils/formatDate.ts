export default function formatDate(date: Date | string | null): string {
  if (!date) return "---";

  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    return "---";
  }

  return parsedDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}