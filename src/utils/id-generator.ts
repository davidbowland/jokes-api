import { randomInt } from 'crypto'

import { idMaxLength, idMinLength } from '../config'

// Excludes vowels (prevents accidental words), 0 (looks like O), 1 (looks like I/l), 3 (looks like E), 4 (looks like A)
const allowedCharacters = '256789bcdfghjmnpqrstvwxz'

const valueToId = (value: number): string => {
  const digit = allowedCharacters.charAt(value % allowedCharacters.length)
  return value >= allowedCharacters.length ? valueToId(Math.floor(value / allowedCharacters.length)) + digit : digit
}

export const generateId = (): string => {
  const minValue = Math.pow(allowedCharacters.length, idMinLength - 1)
  const maxValue = Math.pow(allowedCharacters.length, idMaxLength)
  const randomValue = randomInt(minValue, maxValue)
  return valueToId(randomValue)
}
