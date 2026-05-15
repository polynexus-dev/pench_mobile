/**
 * Format an ISO date string to a human-readable date.
 * e.g. "2024-01-15T10:30:00Z" → "15 Jan 2024"
 */
export function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

/**
 * Format an ISO date string to time.
 * e.g. "2024-01-15T10:30:00Z" → "10:30 AM"
 */
export function formatTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });
}

/**
 * Format an ISO date string to full date + time.
 */
export function formatDateTime(iso: string): string {
    return `${formatDate(iso)}, ${formatTime(iso)}`;
}

/**
 * Returns true if the given ISO date string is today.
 */
export function isToday(iso: string): boolean {
    const d = new Date(iso);
    const today = new Date();
    return (
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate()
    );
}

/**
 * Get a short relative label: "Today", "Yesterday", or formatted date.
 */
export function getRelativeLabel(iso: string): string {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (isToday(iso)) return "Today";
    if (
        d.getFullYear() === yesterday.getFullYear() &&
        d.getMonth() === yesterday.getMonth() &&
        d.getDate() === yesterday.getDate()
    )
        return "Yesterday";
    return formatDate(iso);
}
