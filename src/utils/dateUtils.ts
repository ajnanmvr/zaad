/**
 * Formats a date string to a localized format
 * @param dateString - The date string to format
 * @param options - Optional formatting options
 * @returns Formatted date string or "N/A" for invalid dates
 */
export function formatDate(
    dateString: string | null | undefined,
    options: Intl.DateTimeFormatOptions = {
        day: "2-digit",
        month: "short",
        year: "numeric"
    }
): string {
    if (!dateString) return "N/A";

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";

    return date.toLocaleDateString("en-GB", options);
}

/**
 * Formats a date string to include time
 * @param dateString - The date string to format
 * @returns Formatted date and time string or "N/A" for invalid dates
 */
export function formatDateTime(dateString: string | null | undefined): string {
    return formatDate(dateString, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
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

    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;

    return `${Math.floor(diffInDays / 365)} years ago`;
}