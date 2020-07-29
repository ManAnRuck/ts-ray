export const isStringArray = (array: any): array is string[] => {
  const a = array as any[];
  return a.every((v) => typeof v === "string");
};
