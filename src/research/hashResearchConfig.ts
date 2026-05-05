function normalizeResearchConfig(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map((entry) => normalizeResearchConfig(entry));
    }
    if (value && typeof value === 'object') {
        const normalizedEntries = Object.entries(value as Record<string, unknown>)
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([key, entry]) => [key, normalizeResearchConfig(entry)]);
        return Object.fromEntries(normalizedEntries);
    }
    if (typeof value === 'number' && !Number.isFinite(value)) {
        return null;
    }
    return value ?? null;
}

function stableStringify(value: unknown): string {
    return JSON.stringify(normalizeResearchConfig(value));
}

function hashString(value: string): string {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
        hash ^= value.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, '0');
}

export function hashResearchConfig(config: unknown): string {
    return hashString(stableStringify(config));
}
