import {
  BooleanValueNode,
  EnumValueNode,
  FloatValueNode,
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLInt,
  GraphQLScalarType,
  GraphQLString,
  IntValueNode,
  Kind,
  ListValueNode,
  ObjectValueNode,
  StringValueNode,
  ValueNode,
  VariableNode,
} from 'graphql'

// Public: Convert AST nodes to their corresponding JSON values.
// Supports all kinds of JSON-compatible values in GraphQL.
//
// Examples
//
//   astToJson[Kind.INT](ast)
//   // => 42
//
// ast - A GraphQL AST node.
//
// Returns the parsed value from the AST node or `null` if unsupported.
const astToJson: Record<ValueNode['kind'], (ast: ValueNode) => unknown> = {
  [Kind.INT]: (ast: ValueNode) => GraphQLInt.parseLiteral(ast as IntValueNode, {}),
  [Kind.FLOAT]: (ast: ValueNode) => GraphQLFloat.parseLiteral(ast as FloatValueNode, {}),
  [Kind.BOOLEAN]: (ast: ValueNode) => GraphQLBoolean.parseLiteral(ast as BooleanValueNode, {}),
  [Kind.STRING]: (ast: ValueNode) => GraphQLString.parseLiteral(ast as StringValueNode, {}),
  [Kind.ENUM]: (ast: ValueNode) => (ast as EnumValueNode).value,
  [Kind.LIST]: (ast: ValueNode) => (ast as ListValueNode).values.map((item) => JSONType.parseLiteral(item)),
  [Kind.OBJECT]: (ast: ValueNode) => {
    const objectAst = ast as ObjectValueNode
    const obj: Record<string, unknown> = {}
    objectAst.fields.forEach((field) => {
      obj[field.name.value] = JSONType.parseLiteral(field.value)
    })
    return obj
  },
  [Kind.VARIABLE]: (ast: ValueNode): unknown => {
    // Returns a function to resolve query variables.
    return (variables: Record<string, unknown>) => variables[(ast as VariableNode).name.value]
  },
  [Kind.NULL]: function (): unknown {
    throw new Error('Function not implemented.')
  },
}

// Public: Custom GraphQL Scalar Type for representing JSON values.
//
// Examples
//
//   serialize({ foo: 'bar' })
//   // => { foo: 'bar' }
//
//   parseValue('{"foo":"bar"}')
//   // => { foo: 'bar' }
//
//   parseLiteral(ast)
//   // => Parsed JSON object or value.
//
// Returns a new GraphQLScalarType for JSON.
export const JSONType = new GraphQLScalarType({
  name: 'SequelizeJSON',
  description: 'The `JSON` scalar type represents raw JSON as values.',
  serialize: (value: unknown): unknown => value,
  parseValue: (value: unknown): unknown => (typeof value === 'string' ? JSON.parse(value) : value),
  parseLiteral: (ast: ValueNode): unknown => {
    const parser = astToJson[ast.kind]
    return parser ? parser(ast) : null
  },
})

export default JSONType
