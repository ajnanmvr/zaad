export default function formatDate(date: Date | string | null): string {
    if (!date) return "---";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  }