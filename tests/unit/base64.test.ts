import { describe, expect, it } from 'vitest'
import { base64, unbase64 } from '../../src/base64.ts'

describe('base64', () => {
  it('should encode an ASCII string to Base64', () => {
    const input = 'hello'
    const expected = 'aGVsbG8='
    const result = base64(input)
    expect(result).toBe(expected)
  })

  it('should throw a TypeError if input is not a string', () => {
    // @ts-expect-error Testing non-string input
    expect(() => base64(123)).toThrow(TypeError)
  })
})

describe('unbase64', () => {
  it('should decode a Base64 string to ASCII', () => {
    const input = 'aGVsbG8='
    const expected = 'hello'
    const result = unbase64(input)
    expect(result).toBe(expected)
  })

  it('should throw a TypeError if input is not a string', () => {
    // @ts-expect-error Testing non-string input
    expect(() => unbase64(123)).toThrow(TypeError)
  })
})
