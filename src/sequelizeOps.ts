import { transform } from 'lodash'
import { Op } from 'sequelize'

// Public: Returns Sequelize operator mappings.
//
// Examples
//
//   const ops = getSequelizeOps()
//   // => { eq: Op.eq, ne: Op.ne, ... }
//
// Returns an object containing Sequelize operators mapped to their symbols.
export function getSequelizeOps(): Record<string, symbol> {
  let ops: Record<string, symbol> = {}

  // Map Sequelize.Op properties to a plain object
  return transform(
    Op,
    (result: Record<string, symbol>, value, key) => {
      if (typeof value === 'symbol') {
        result[key] = value
      }
    },
    ops,
  )
}

export default getSequelizeOps
