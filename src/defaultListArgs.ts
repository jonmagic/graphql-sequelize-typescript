import { GraphQLInt, GraphQLScalarType, GraphQLString } from 'graphql'
import JSONType from '../src/types/jsonType.ts'

// Public: Generates default GraphQL argument definitions for list queries.
//
// Returns an object containing default arguments for list queries.
export function defaultListArgs(): Record<
  string,
  { type: GraphQLScalarType | typeof GraphQLInt | typeof GraphQLString; description?: string }
> {
  return {
    limit: {
      type: GraphQLInt,
    },
    order: {
      type: GraphQLString,
    },
    where: {
      type: JSONType,
      description:
        'A JSON object conforming to the shape specified in http://docs.sequelizejs.com/en/latest/docs/querying/',
    },
    offset: {
      type: GraphQLInt,
    },
  }
}
