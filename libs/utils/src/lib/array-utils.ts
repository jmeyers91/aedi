export function uniqBy<T>(values: T[], fn: (value: T) => unknown) {
  return Array.from(
    new Map(values.map((value) => [fn(value), value])).values()
  );
}
