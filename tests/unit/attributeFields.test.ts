import { describe, it, expect, vi } from 'vitest'
import { attributeFields } from '../../src/attributeFields.ts'
import { GraphQLNonNull, GraphQLString } from 'graphql'
import { DataTypes } from 'sequelize'

describe('attributeFields', () => {
  const mockTypeMapper = {
    toGraphQL: vi.fn(() => GraphQLString),
  }
  vi.mock('../src/typeMapper.js', () => mockTypeMapper)

  const mockSequelize = {
    constructor: {
      DataTypes,
    },
  }

  const mockModel = {
    name: 'TestModel',
    sequelize: mockSequelize,
    rawAttributes: {
      id: { type: DataTypes.INTEGER(), allowNull: false, primaryKey: true, comment: 'ID Field' },
      name: { type: DataTypes.STRING(), allowNull: true, primaryKey: false },
    },
    primaryKeyAttribute: 'id',
  }

  it('should generate GraphQL fields from model attributes', () => {
    const fields = attributeFields(mockModel)

    expect(fields.id.type).toBeInstanceOf(GraphQLNonNull)
    expect(fields.name.type).toBe(GraphQLString)
  })

  it('should exclude fields based on the exclude option', () => {
    const fields = attributeFields(mockModel, { exclude: ['name'] })
    expect(fields).not.toHaveProperty('name')
  })

  it('should include only specified fields based on the only option', () => {
    const fields = attributeFields(mockModel, { only: ['id'] })
    expect(fields).toHaveProperty('id')
    expect(fields).not.toHaveProperty('name')
  })

  it('should map field names based on the map option', () => {
    const fields = attributeFields(mockModel, {
      map: (key) => (key === 'name' ? 'customName' : key),
    })
    expect(fields).toHaveProperty('customName')
  })

  it('should add descriptions from comments if commentToDescription is true', () => {
    const modelWithComments = {
      ...mockModel,
      rawAttributes: {
        id: { ...mockModel.rawAttributes.id, comment: 'Primary Key' },
      },
    }
    const fields = attributeFields(modelWithComments, { commentToDescription: true })
    expect(fields.id.description).toBe('Primary Key')
  })
})
