export function formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
}

export function formatTimestamp(unix) {
    return new Date(unix * 1000).toISOString();
}

export function truncate(text, length = 100) {
    if (text.length <= length) return text;
    return `${text.slice(0, length - 3)}...`;
}