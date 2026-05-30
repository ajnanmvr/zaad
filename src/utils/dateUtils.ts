import { DUBAI_TIME_ZONE, formatDubaiDate, formatDubaiDateTime, getDubaiNow } from "@/utils/dubaiTime";

/**
 * Formats a date string to a localized format in Dubai time.
 * @param dateString - The date string to format
 * @param options - Optional formatting options
 * @returns Formatted date string or "N/A" for invalid dates
 */
export function formatDate(dateString: string | null | undefined): string {
    const formatted = formatDubaiDate(dateString, {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });

    return formatted === "---" ? "N/A" : formatted;
}

/**
 * Formats a date string to include time
 * @param dateString - The date string to format
 * @returns Formatted date and time string or "N/A" for invalid dates
 */
export function formatDateTime(dateString: string | null | undefined): string {
    const formatted = formatDubaiDateTime(dateString);
    return formatted === "---" ? "N/A" : formatted;
}

/**
 * Formats a date string to a relative format (e.g., "2 days ago")
 * @param dateString - The date string to format
 * @returns Relative date string or "N/A" for invalid dates
 */
export function formatRelativeDate(dateString: string | null | undefined): string {
    if (!dateString) return "N/A";

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";

    const now = getDubaiNow();
    const dubaiDate = new Date(date.toLocaleString("en-US", { timeZone: DUBAI_TIME_ZONE }));
    const diffInMs = now.getTime() - dubaiDate.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (now.toDateString() === dubaiDate.toDateString()) return "Today";
    if (now.getTime() - dubaiDate.getTime() < 2 * 24 * 60 * 60 * 1000 && diffInDays >= 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;

    return `${Math.floor(diffInDays / 365)} years ago`;
}