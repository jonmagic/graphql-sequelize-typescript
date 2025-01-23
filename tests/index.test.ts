import { describe, it, expect } from 'vitest'
import hello from '../src/index.ts'

describe('hello function', () => {
  it('returns a greeting with the provided name', () => {
    const result = hello('Jon')
    expect(result).toBe('hello Jon')
  })
})
