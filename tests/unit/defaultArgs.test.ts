import { describe, expect, it, vi } from 'vitest'
import { defaultArgs } from '../../src/defaultArgs.js'
import * as typeMapper from '../../src/typeMapper.js'
import JSONType from '../../src/types/jsonType.js'
import { GraphQLInt, GraphQLScalarType } from 'graphql'
import { Attributes, Model, ModelStatic } from 'sequelize'

describe('defaultArgs', () => {
  // Mocking the ModelStatic with `getAttributes` and `primaryKeyAttributes`
  const mockModel: Partial<ModelStatic<Model>> = {
    primaryKeyAttributes: ['id', 'uuid'],
    getAttributes: vi.fn(() => ({
      id: { type: { key: 'INTEGER' } },
      uuid: { type: { key: 'UUID' } },
    })) as <M extends Model>(this: ModelStatic<M>) => Attributes<M>,
  }

  it('should return GraphQL arguments for primary key attributes', () => {
    vi.spyOn(typeMapper, 'toGraphQL').mockImplementation((type) => {
      if (type.key === 'INTEGER') return GraphQLInt
      if (type.key === 'UUID') return new GraphQLScalarType({ name: 'UUID' })
      return new GraphQLScalarType({ name: 'Unknown' })
    })

    const args = defaultArgs(mockModel as ModelStatic<Model>)

    expect(args).toHaveProperty('id')
    expect(args.id.type).toEqual(GraphQLInt)
    expect(args).toHaveProperty('uuid')
    expect((args.uuid.type as GraphQLScalarType).name).toEqual('UUID')

    vi.restoreAllMocks()
  })

  it('should include a where argument with JSONType', () => {
    vi.spyOn(typeMapper, 'toGraphQL').mockImplementation((type) => {
      if (type.key === 'INTEGER') return GraphQLInt
      if (type.key === 'UUID') return new GraphQLScalarType({ name: 'UUID' })
      if (type.key === 'JSON') return JSONType // Mock handling of JSONType
      return new GraphQLScalarType({ name: 'Unknown' })
    })

    const args = defaultArgs(mockModel as ModelStatic<Model>)

    expect(args).toHaveProperty('where')
    expect(args.where.type).toBe(JSONType) // Check that JSONType is properly returned
    expect(args.where.description).toBe(
      'A JSON object conforming to the shape specified in http://docs.sequelizejs.com/en/latest/docs/querying/',
    )

    vi.restoreAllMocks()
  })
})
