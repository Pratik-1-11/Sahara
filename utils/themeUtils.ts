// Utility function to convert readonly color tuples to mutable string arrays
export const toGradientColors = <T extends readonly string[]>(
  colors: T
): string[] => [...colors];
