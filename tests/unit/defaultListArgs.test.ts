import { GraphQLInt, GraphQLScalarType, GraphQLString } from 'graphql'
import { describe, expect, it } from 'vitest'
import { defaultListArgs } from '../../src/defaultListArgs.ts'

describe('defaultListArgs', () => {
  it('should return a limit key with type GraphQLInt', () => {
    const args = defaultListArgs()

    expect(args).toHaveProperty('limit')
    expect(args.limit.type).toBe(GraphQLInt)
  })

  it('should return an order key with type GraphQLString', () => {
    const args = defaultListArgs()

    expect(args).toHaveProperty('order')
    expect(args.order.type).toBe(GraphQLString)
  })

  describe('the "where" argument', () => {
    it('should be an instance of GraphQLScalarType', () => {
      const args = defaultListArgs()

      expect(args).toHaveProperty('where')
      expect(args.where.type).toBeInstanceOf(GraphQLScalarType)
    })
  })
})
