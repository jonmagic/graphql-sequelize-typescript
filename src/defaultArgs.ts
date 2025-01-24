import { GraphQLInputType } from 'graphql'
import { AbstractDataType, DataTypes, ModelStatic, Model } from 'sequelize'
import { toGraphQL } from './typeMapper.js'
import JSONType from './types/jsonType.js'

// Public: Generate default GraphQL arguments for a Sequelize Model.
//
// Examples
//
//   const args = defaultArgs(UserModel)
//   // => { id: { type: GraphQLInt }, where: { type: JSONType, description: '...' } }
//
// Model - A Sequelize Model instance.
//
// Returns an object containing GraphQL argument definitions.
export function defaultArgs<ModelType extends Model>(
  Model: ModelStatic<ModelType>,
): Record<string, { type: GraphQLInputType; description?: string }> {
  const result: Record<string, { type: GraphQLInputType; description?: string }> = {}
  const primaryKeyAttributes = Model.primaryKeyAttributes

  if (primaryKeyAttributes) {
    primaryKeyAttributes.forEach((key) => {
      const attributes = Model.getAttributes()
      const attribute = attributes[key]
      if (attribute && 'type' in attribute) {
        const type = toGraphQL(attribute.type as AbstractDataType, DataTypes) as GraphQLInputType
        result[key] = {
          type,
        }
      }
    })
  }

  result.where = {
    type: JSONType,
    description:
      'A JSON object conforming to the shape specified in http://docs.sequelizejs.com/en/latest/docs/querying/',
  }

  return result
}
