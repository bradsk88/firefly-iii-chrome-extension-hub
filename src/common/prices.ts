export function priceFromString(
    str: string,
): number {
    const stripped = str
        .replace('$', '')
        .replaceAll(',', '')
        .replaceAll(' ', '');
    return Number.parseFloat(stripped);
}