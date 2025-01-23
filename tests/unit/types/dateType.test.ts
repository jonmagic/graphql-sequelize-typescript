import { Kind, ValueNode } from 'graphql'
import { describe, expect, it } from 'vitest'
import DateType from '../../../src/types/dateType.ts'

describe('DateScalar', () => {
  it('serializes a valid Date object to ISO string', () => {
    const date = new Date('2025-01-01T00:00:00.000Z')
    expect(DateType.serialize(date)).toBe('2025-01-01T00:00:00.000Z')
  })

  it('returns null when serializing an invalid Date object', () => {
    const invalidDate = new Date('invalid date')
    expect(DateType.serialize(invalidDate)).toBeNull()
  })

  it('parses a valid date string into a Date object', () => {
    const dateString = '2025-01-01T00:00:00.000Z'
    const parsedDate = DateType.parseValue(dateString)
    expect(parsedDate).toBeInstanceOf(Date)
    expect(parsedDate?.toISOString()).toBe(dateString)
  })

  it('returns null when parsing an invalid date string', () => {
    const invalidDateString = 'invalid date'
    expect(DateType.parseValue(invalidDateString)).toBeNull()
  })

  it('parses a valid AST string literal into a Date object', () => {
    const ast: { kind: typeof Kind.STRING; value: string } = { kind: Kind.STRING, value: '2025-01-01T00:00:00.000Z' }
    const parsedDate = DateType.parseLiteral(ast)
    expect(parsedDate).toBeInstanceOf(Date)
    expect(parsedDate?.toISOString()).toBe('2025-01-01T00:00:00.000Z')
  })

  it('returns null when parsing an invalid AST string literal', () => {
    const invalidAst: { kind: typeof Kind.STRING; value: string } = { kind: Kind.STRING, value: 'invalid date' }
    expect(DateType.parseLiteral(invalidAst)).toBeNull()
  })

  it('returns null for non-string AST nodes', () => {
    const nonStringAst: ValueNode = { kind: Kind.INT, value: '123456' }
    expect(DateType.parseLiteral(nonStringAst)).toBeNull()
  })
})
