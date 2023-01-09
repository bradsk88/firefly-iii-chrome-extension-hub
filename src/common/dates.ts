
export const monthIndexes: { [key: string]: number } = {
    'jan': 0,
    'feb': 1,
    'mar': 2,
    'apr': 3,
    'may': 4,
    'jun': 5,
    'jul': 6,
    'aug': 7,
    'sep': 8,
    'oct': 9,
    'nov': 10,
    'dec': 11,
}

export function parseDate(dateStr: string): Date {
    const dateParts = dateStr.split(', ');
    const year = Number.parseInt(dateParts[1]);
    let dayParts = dateParts[0].split(' ');
    const monthPrf: string = dayParts[0].substring(0, 3);
    const month = monthIndexes[monthPrf.toLowerCase()];
    const day = Number.parseInt(dayParts[1]);
    return new Date(year || new Date().getFullYear(), month, day);
}