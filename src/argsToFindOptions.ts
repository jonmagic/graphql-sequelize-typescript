import { replaceWhereOperators } from './replaceWhereOperators.ts'

type Order = 'ASC' | 'DESC'

export interface Args {
  limit?: string | number
  offset?: string | number
  order?: string
  where?: Record<string, unknown>
  [key: string]: unknown
}

export interface FindOptions {
  limit?: number
  offset?: number
  order?: [string, Order][]
  where?: Record<string, unknown>
}

// Public: Converts arguments to Sequelize find options.
//
// Examples
//
//   argsToFindOptions({ limit: "10", offset: "5" }, ['name'])
//   // => { limit: 10, offset: 5, where: { name: value } }
//
// args - An object of arguments, where keys correspond to query options.
// targetAttributes - An array of strings representing target attributes.
//
// Returns a FindOptions object containing Sequelize query options.
export default function argsToFindOptions(args: Args, targetAttributes: string[]): FindOptions {
  const result: FindOptions = {}

  if (args) {
    Object.keys(args).forEach((key) => {
      const value = args[key]
      if (typeof value !== 'undefined') {
        if (key === 'limit') {
          result.limit = Number(value as string)
        } else if (key === 'offset') {
          result.offset = Number(value as string)
        } else if (key === 'order') {
          if (typeof value === 'string' && value.startsWith('reverse:')) {
            result.order = [[value.substring(8), 'DESC']]
          } else if (typeof value === 'string') {
            result.order = [[value, 'ASC']]
          }
        } else if (key === 'where') {
          result.where = replaceWhereOperators(value as Record<string, unknown>)
        } else if (targetAttributes.includes(key)) {
          result.where = result.where || {}
          result.where[key] = value
        }
      }
    })
  }

  return result
}
