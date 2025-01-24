import { GraphQLEnumType, GraphQLFieldConfigMap, GraphQLList, GraphQLNonNull, GraphQLOutputType } from 'graphql'
import { globalIdField } from 'graphql-relay'
import { toGraphQL } from './typeMapper.js'

import { AbstractDataType } from 'sequelize'

type Attribute = {
  type: AbstractDataType
  allowNull: boolean
  primaryKey: boolean
  comment?: string
}

type ModelType = {
  name: string
  sequelize: {
    constructor: {
      DataTypes: typeof import('sequelize/types/data-types')
    }
  }
  rawAttributes: Record<string, Attribute>
  primaryKeyAttribute: string
}

type Options = {
  cache?: Record<string, GraphQLOutputType>
  exclude?: ((key: string) => boolean) | string[]
  only?: ((key: string) => boolean) | string[]
  map?: ((key: string) => string | undefined) | Record<string, string>
  allowNull?: boolean
  commentToDescription?: boolean
  globalId?: boolean
}

type AttributeFieldsResult = GraphQLFieldConfigMap<Record<string, unknown>, unknown>

// Public: Generate GraphQL field configurations for a Sequelize model.
//
// Model - A Sequelize model.
// options - Optional configuration object with keys:
//           exclude              - Array or function to exclude certain fields.
//           only                 - Array or function to include only certain fields.
//           map                  - Function or map to rename fields.
//           allowNull            - Boolean indicating whether to enforce non-null.
//           commentToDescription - Boolean to use comments as GraphQL descriptions.
//           globalId             - Boolean to add a Relay global ID field.
//           cache                - Object for caching enum types.
//
// Returns a GraphQLFieldConfigMap containing field configurations.
export function attributeFields(Model: ModelType, options: Options = {}): AttributeFieldsResult {
  const cache = options.cache || {}

  const result = Object.keys(Model.rawAttributes).reduce<AttributeFieldsResult>((memo, key) => {
    if (options.exclude) {
      if (
        (typeof options.exclude === 'function' && options.exclude(key)) ||
        (Array.isArray(options.exclude) && options.exclude.includes(key))
      ) {
        return memo
      }
    }

    if (options.only) {
      if (
        (typeof options.only === 'function' && !options.only(key)) ||
        (Array.isArray(options.only) && !options.only.includes(key))
      ) {
        return memo
      }
    }

    let attributeKey = key
    const attribute = Model.rawAttributes[key]
    const type = attribute.type

    if (options.map) {
      if (typeof options.map === 'function') {
        attributeKey = options.map(key) || key
      } else {
        attributeKey = options.map[key] || key
      }
    }

    let graphqlType = toGraphQL(type, Model.sequelize.constructor.DataTypes) as GraphQLOutputType

    memo[attributeKey] = { type: graphqlType }

    if (
      graphqlType instanceof GraphQLEnumType ||
      (graphqlType instanceof GraphQLList && graphqlType.ofType instanceof GraphQLEnumType)
    ) {
      const typeName = `${Model.name}${key}EnumType`

      if (cache[typeName]) {
        // Cache hit
        if (graphqlType instanceof GraphQLList && graphqlType.ofType instanceof GraphQLEnumType) {
          memo[attributeKey].type = new GraphQLList(cache[typeName] as GraphQLEnumType)
        } else {
          memo[attributeKey].type = cache[typeName]
        }
      } else {
        // Cache miss
        if (graphqlType instanceof GraphQLList && graphqlType.ofType instanceof GraphQLEnumType) {
          const newEnumType = new GraphQLEnumType({
            ...graphqlType.ofType.toConfig(),
            name: typeName,
          })
          graphqlType = new GraphQLList(newEnumType)
          cache[typeName] = newEnumType
        } else if (graphqlType instanceof GraphQLEnumType) {
          graphqlType.name = typeName
          cache[typeName] = graphqlType
        }
      }
    }

    if (!options.allowNull) {
      if (attribute.allowNull === false || attribute.primaryKey === true) {
        memo[attributeKey].type = new GraphQLNonNull(graphqlType)
      }
    }

    if (options.commentToDescription && typeof attribute.comment === 'string') {
      memo[attributeKey].description = attribute.comment
    }

    return memo
  }, {})

  if (options.globalId) {
    result.id = globalIdField(Model.name, (instance) => instance[Model.primaryKeyAttribute])
  }

  return result
}
