export function chunk<T>(input: Array<T>, size: number) {
  return input.reduce(
    (arr, item, idx) => {
      return idx % size === 0
        ? [...arr, [item]]
        : [...arr.slice(0, -1), [...arr.slice(-1)[0], item]];
    },
    [] as Array<Array<T>>,
  );
}

export function zip<T, U>(a1: Array<T>, a2: Array<U>) {
  const resultLength = Math.max(a1.length, a2.length);
  return new Array(resultLength).fill([]).map((_val, idx) => [a1[idx], a2[idx]]);
}

export function differenceBy<T>(a1: Array<T>, a2: Array<T>, by: (arg: T) => string) {
  return a1.filter((c) => !a2.map((v) => by(v)).includes(by(c)));
}
