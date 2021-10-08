// prettier-ignore
export const handleErrorWithDefault =
  <Type>(value: Type) => (error: Error): Type => (console.error(error), value)
