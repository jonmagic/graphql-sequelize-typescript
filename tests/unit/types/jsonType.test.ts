import { EnumValueNode, IntValueNode, Kind, ListValueNode, ObjectValueNode, StringValueNode } from 'graphql'
import { describe, expect, it } from 'vitest'
import { JSONType } from '../../../src/types/jsonType.ts'

describe('JSONType', () => {
  it('should serialize a value', () => {
    const value = { foo: 'bar' }
    expect(JSONType.serialize(value)).toEqual(value)
  })

  it('should parse a valid JSON string value', () => {
    const value = '{"foo":"bar"}'
    expect(JSONType.parseValue(value)).toEqual({ foo: 'bar' })
  })

  it('should return the value directly if it is not a string', () => {
    const value = { foo: 'bar' }
    expect(JSONType.parseValue(value)).toEqual(value)
  })

  it('should parse literals of type INT', () => {
    const ast: IntValueNode = { kind: Kind.INT, value: '42' }
    expect(JSONType.parseLiteral(ast)).toEqual(42)
  })

  it('should parse literals of type STRING', () => {
    const ast: StringValueNode = { kind: Kind.STRING, value: 'hello' }
    expect(JSONType.parseLiteral(ast)).toEqual('hello')
  })

  it('should parse literals of type LIST', () => {
    const ast: ListValueNode = {
      kind: Kind.LIST,
      values: [
        { kind: Kind.INT, value: '42' },
        { kind: Kind.STRING, value: 'test' },
      ],
    }
    expect(JSONType.parseLiteral(ast)).toEqual([42, 'test'])
  })

  it('should parse literals of type OBJECT', () => {
    const ast: ObjectValueNode = {
      kind: Kind.OBJECT,
      fields: [
        {
          name: { kind: Kind.NAME, value: 'key1' },
          value: { kind: Kind.STRING, value: 'value1' },
          kind: Kind.OBJECT_FIELD,
        },
        {
          kind: Kind.OBJECT_FIELD,
          name: { value: 'key2', kind: Kind.NAME },
          value: { kind: Kind.INT, value: '42' },
        },
      ],
    }
    expect(JSONType.parseLiteral(ast)).toEqual({ key1: 'value1', key2: 42 })
  })

  it('should parse literals of type ENUM', () => {
    const ast: EnumValueNode = { kind: Kind.ENUM, value: 'ENUM_VALUE' }
    expect(JSONType.parseLiteral(ast)).toEqual('ENUM_VALUE')
  })
})
