import {priceFromString} from "./prices";

describe('priceFromString', () => {
    const cases = {
        '$1.01': 1.01,
        '-$2.12': -2.12,
        '$-3.23': -3.23,
        ' - $4.34': -4.34,
        '$1,000.00': 1000,
    }
    Object.entries(cases).forEach(
        ([input, output]: [string, number]): void => {
            test(input, () => expect(priceFromString(input)).toEqual(output));
        },
    )
})
