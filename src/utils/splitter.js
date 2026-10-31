export function splitMessage(text, limit) {
    if (!text) return [''];
    if (text.length <= limit) return [text];

    const chunks = [];
    let remaining = text;

    while (remaining.length > limit) {
        let cut = remaining.lastIndexOf('\n', limit);
        if (cut < limit * 0.5) cut = remaining.lastIndexOf(' ', limit);
        if (cut < limit * 0.5) cut = limit;
        chunks.push(remaining.slice(0, cut).trim());
        remaining = remaining.slice(cut).trim();
    }
    if (remaining.length > 0) chunks.push(remaining);
    return chunks;
}