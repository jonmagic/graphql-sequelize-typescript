import { GraphQLScalarType, Kind } from 'graphql'

// Public: A custom GraphQLScalarType representing Dates, serialized as ISO 8601 formatted strings.
//
// The `Date` scalar handles conversion between JavaScript `Date` objects
// and ISO 8601 date strings for GraphQL queries and mutations.
//
// Examples
//
//   Query: { someDateField }
//   Response: '2025-01-01T00:00:00.000Z'
//
//   Mutation: { setSomeDateField(date: "2025-01-01T00:00:00.000Z") }
//   Input: '2025-01-01T00:00:00.000Z'
//
// Returns a GraphQLScalarType instance for managing `Date` values.
export default new GraphQLScalarType({
  name: 'Date',
  description:
    'A custom Scalar type for Dates, converting JavaScript Date objects to ISO 8601 strings and parsing ISO 8601 strings back to JavaScript Date objects.',

  // Public: Serialize a JavaScript Date object into an ISO 8601 formatted string.
  //
  // d - A `Date` object to serialize.
  //
  // Examples
  //
  //   serialize(new Date('2025-01-01'))
  //   // => '2025-01-01T00:00:00.000Z'
  //
  // Returns a String containing the ISO 8601 date string, or `null` if `d` is invalid.
  serialize(d: unknown): string | null {
    if (d instanceof Date && !isNaN(d.getTime())) {
      return d.toISOString()
    }
    return null
  },

  // Public: Parse a value from a GraphQL input into a JavaScript Date object.
  //
  // value - A string in ISO 8601 format representing a date.
  //
  // Examples
  //
  //   parseValue('2025-01-01T00:00:00.000Z')
  //   // => new Date('2025-01-01T00:00:00.000Z')
  //
  // Returns a `Date` object parsed from the string, or `null` if parsing fails.
  parseValue(value: unknown): Date | null {
    if (typeof value === 'string') {
      const parsedDate = new Date(value)
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate
      }
    }
    return null
  },

  // Public: Parse a literal from a GraphQL query AST into a JavaScript Date object.
  //
  // ast - An AST node representing the input value.
  //
  // Examples
  //
  //   parseLiteral({ kind: 'StringValue', value: '2025-01-01T00:00:00.000Z' })
  //   // => new Date('2025-01-01T00:00:00.000Z')
  //
  // Returns a `Date` object parsed from the literal, or `null` if parsing fails.
  parseLiteral(ast): Date | null {
    if (ast.kind === Kind.STRING) {
      const parsedDate = new Date(ast.value)
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate
      }
    }
    return null
  },
})
