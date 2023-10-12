import fs from 'node:fs'

export function readJsonFile(filename: string) {
    return JSON.parse(fs.readFileSync(filename, 'utf8'));
}

// replace all - and spaces with _ and lowercase the metricName for Datadog query
export function formatMetricNameForDatadog(metricName: string): string {
    return metricName.replace(/-| /g, '_').toLowerCase();
}

// Capitalize and replace dashes with space for audit names
export function formatAuditName(input: string): string {
    const words = input.split('-');
    const capitalizedWords = words.map(word => word.charAt(0).toUpperCase() + word.slice(1));
    return capitalizedWords.join(' ');
}
