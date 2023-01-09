import {parseDate} from "./dates";

test('parses date like Jan 15, 2023', () => {
    const d = parseDate('Jan 15, 2023')
    expect(d.getFullYear()).toEqual(2023)
    expect(d.getMonth()).toEqual(0);
    expect(d.getDate()).toEqual(15)
})

test('parses date like Feb 24 (assume current year)', () => {
    const d = parseDate('Feb 24')
    const currentYear = new Date().getFullYear();

    expect(d.getFullYear()).toEqual(currentYear)
    expect(d.getMonth()).toEqual(1);
    expect(d.getDate()).toEqual(24)
})