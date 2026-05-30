import { formatDubaiDate } from "@/utils/dubaiTime";

export default function formatDate(date: Date | string | null): string {
  return formatDubaiDate(date, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}