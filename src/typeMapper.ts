import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFloat,
  GraphQLInt,
  GraphQLList,
  GraphQLScalarType,
  GraphQLString,
  GraphQLType,
} from 'graphql'
import { AbstractDataType, AbstractDataTypeConstructor, DataTypes as SequelizeDataTypes } from 'sequelize'
import DateType from './types/dateType.js'
import JSONType from './types/jsonType.js'

type CustomTypeMapper = (sequelizeType: AbstractDataType) => GraphQLScalarType | GraphQLEnumType | null

let customTypeMapper: CustomTypeMapper | null = null

// Public: Set a custom mapping function for Sequelize types.
//
// mapFunc - A function that accepts a Sequelize type and returns a GraphQL type.
//
// Returns nothing.
export function mapType(mapFunc: CustomTypeMapper): void {
  customTypeMapper = mapFunc
}

// Public: Convert a Sequelize data type into a corresponding GraphQL type.
//
// sequelizeType - The Sequelize data type to convert.
// sequelizeTypes - The Sequelize DataTypes object to check against.
//
// Returns the corresponding GraphQL type or throws an Error if no mapping exists.
export function toGraphQL(
  sequelizeType: AbstractDataType,
  sequelizeTypes: typeof SequelizeDataTypes,
): GraphQLScalarType | GraphQLEnumType | GraphQLList<GraphQLScalarType | GraphQLEnumType | GraphQLList<GraphQLType>> {
  if (customTypeMapper) {
    const result = customTypeMapper(sequelizeType)
    if (result) return result
  }

  const {
    BOOLEAN,
    ENUM,
    FLOAT,
    REAL,
    CHAR,
    DECIMAL,
    DOUBLE,
    INTEGER,
    BIGINT,
    STRING,
    TEXT,
    UUID,
    UUIDV4,
    DATE,
    DATEONLY,
    TIME,
    ARRAY,
    VIRTUAL,
    JSON,
    JSONB,
    CITEXT,
    INET,
  } = sequelizeTypes

  const specialCharsMap = new Map<string, string>([
    ['¼', 'frac14'],
    ['½', 'frac12'],
    ['¾', 'frac34'],
  ])

  if (isSequelizeType(sequelizeType, BOOLEAN)) return GraphQLBoolean
  if (
    isSequelizeType(sequelizeType, FLOAT) ||
    isSequelizeType(sequelizeType, REAL) ||
    isSequelizeType(sequelizeType, DOUBLE)
  )
    return GraphQLFloat
  if (isSequelizeType(sequelizeType, DATE)) return DateType
  if (
    isSequelizeType(sequelizeType, CHAR) ||
    isSequelizeType(sequelizeType, STRING) ||
    isSequelizeType(sequelizeType, TEXT) ||
    isSequelizeType(sequelizeType, UUID) ||
    isSequelizeType(sequelizeType, UUIDV4) ||
    isSequelizeType(sequelizeType, DATEONLY) ||
    isSequelizeType(sequelizeType, TIME) ||
    isSequelizeType(sequelizeType, BIGINT) ||
    isSequelizeType(sequelizeType, DECIMAL) ||
    isSequelizeType(sequelizeType, CITEXT) ||
    isSequelizeType(sequelizeType, INET)
  )
    return GraphQLString
  if (isSequelizeType(sequelizeType, INTEGER)) return GraphQLInt
  if (isSequelizeType(sequelizeType, ARRAY)) {
    const elementType = toGraphQL(getArrayType(sequelizeType), sequelizeTypes) as
      | GraphQLScalarType
      | GraphQLEnumType
      | GraphQLList<GraphQLType>
    return new GraphQLList(elementType)
  }
  if (isSequelizeType(sequelizeType, ENUM)) {
    return new GraphQLEnumType({
      name: 'tempEnumName',
      values: sanitizeEnumValues(getEnumValues(sequelizeType), specialCharsMap),
    })
  }
  if (isSequelizeType(sequelizeType, VIRTUAL)) {
    return getVirtualReturnType(sequelizeType, sequelizeTypes) ?? GraphQLString
  }
  if (isSequelizeType(sequelizeType, JSON) || isSequelizeType(sequelizeType, JSONB)) return JSONType

  throw new Error(`Unable to convert ${(sequelizeType as unknown)?.constructor?.name ?? 'unknown'} to a GraphQL type`)
}

// Internal: Type guard to check if a value is a specific Sequelize type.
//
// value - The value to check.
// type - The Sequelize type constructor to check against.
//
// Returns true if the value is of the given type.
function isSequelizeType<T extends AbstractDataType>(
  value: AbstractDataType,
  type: AbstractDataTypeConstructor,
): value is T {
  return value instanceof type
}

// Internal: Extract the type from an ARRAY data type.
//
// arrayType - A Sequelize ARRAY data type.
//
// Returns the inner type of the array.
function getArrayType(arrayType: AbstractDataType): AbstractDataType {
  if ('type' in arrayType && arrayType.type) {
    return arrayType.type as AbstractDataType
  }
  throw new Error('ARRAY type does not have an inner type')
}

// Internal: Extract the values from an ENUM data type.
//
// enumType - A Sequelize ENUM data type.
//
// Returns the ENUM values as an array of strings.
function getEnumValues(enumType: AbstractDataType): string[] {
  if ('values' in enumType && Array.isArray(enumType.values)) {
    return enumType.values
  }
  throw new Error('ENUM type does not have values')
}

// Internal: Extract the return type from a VIRTUAL data type.
//
// virtualType - A Sequelize VIRTUAL data type.
// sequelizeTypes - The Sequelize DataTypes object.
//
// Returns the GraphQL type of the return type or null if not defined.
function getVirtualReturnType(
  virtualType: AbstractDataType,
  sequelizeTypes: typeof SequelizeDataTypes,
):
  | GraphQLScalarType
  | GraphQLEnumType
  | GraphQLList<GraphQLScalarType | GraphQLEnumType | GraphQLList<GraphQLType>>
  | null {
  if ('returnType' in virtualType && virtualType.returnType) {
    if (
      typeof virtualType.returnType === 'object' &&
      isSequelizeType(virtualType.returnType as AbstractDataType, sequelizeTypes.ABSTRACT)
    ) {
      return toGraphQL(virtualType.returnType as AbstractDataType, sequelizeTypes)
    }
    throw new Error('VIRTUAL returnType is not a valid Sequelize data type')
  }
  return null
}

// Internal: Sanitize ENUM values.
//
// values - An array of ENUM values.
// specialCharsMap - A Map of special characters to replacements.
//
// Returns an object with sanitized keys and original values.
function sanitizeEnumValues(values: string[], specialCharsMap: Map<string, string>): Record<string, { value: string }> {
  return values.reduce(
    (result, value) => {
      const sanitizedKey = value
        .trim()
        .replace(/([^_a-zA-Z0-9])/g, (_, char) => specialCharsMap.get(char) || ' ')
        .split(' ')
        .map((v, index) => (index > 0 ? v.charAt(0).toUpperCase() + v.slice(1) : v))
        .join('')
        .replace(/(^\d)/, '_$1')
      result[sanitizedKey] = { value }
      return result
    },
    {} as Record<string, { value: string }>,
  )
}
