export function capitalizeFirst(value: string) {
  if (value.length === 0) {
    return value;
  }
  return value[0].toUpperCase() + value.slice(1);
}

export function formatContactName(firstName: string, lastName: string) {
  return `${capitalizeFirst(firstName)} ${capitalizeFirst(lastName)}`;
}
