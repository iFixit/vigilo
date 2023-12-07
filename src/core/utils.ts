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

// Merge two objects, preserving nested objects
export function deepMerge(target: any, source: any) {
    const isObject = (item: any) => item && typeof item === 'object' && !Array.isArray(item);

    let output = Object.assign({}, target);
    if (isObject(target) && isObject(source)) {
      Object.keys(source).forEach(key => {
        if (isObject(source[key])) {
          if (!(key in target))
            Object.assign(output, { [key]: source[key] });
          else
            output[key] = deepMerge(target[key], source[key]);
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    return output;
}