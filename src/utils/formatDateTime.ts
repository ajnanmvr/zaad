import { formatDubaiDateTime } from "@/utils/dubaiTime";

export default function formatDateTime(date: Date | string | null): string {
  return formatDubaiDateTime(date);
}
