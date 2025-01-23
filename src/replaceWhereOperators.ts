import { getSequelizeOps } from './sequelizeOps.js'

// Type definition for key mapping
type KeyMap = Record<string | symbol, string | symbol>

// Type definition for the object being processed
type InputObject = Record<string | symbol, unknown>

// Public: Replace a key deeply in an object.
//
// Examples
//
//   replaceKeyDeep({ and: 1 }, { and: Op.and })
//   // => { [Op.and]: 1 }
//
// obj - The object to process.
// keyMap - A mapping of keys to replace.
//
// Returns an object with the replaced keys.
function replaceKeyDeep(obj: InputObject, keyMap: KeyMap): InputObject {
  return [...Object.getOwnPropertySymbols(obj), ...(Object.keys(obj) as Array<string | symbol>)].reduce<InputObject>(
    (memo, key) => {
      const targetKey = keyMap[key] || key

      if (Array.isArray(obj[key])) {
        memo[targetKey] = (obj[key] as Array<unknown>).map((val) =>
          typeof val === 'object' && val !== null ? replaceKeyDeep(val as InputObject, keyMap) : val,
        )
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        memo[targetKey] = replaceKeyDeep(obj[key] as InputObject, keyMap)
      } else {
        memo[targetKey] = obj[key]
      }

      return memo
    },
    {},
  )
}

// Public: Replace the `where` arguments object and return the Sequelize-compatible version.
//
// Examples
//
//   replaceWhereOperators({ and: 1, or: 'test' })
//   // => { [Op.and]: 1, [Op.or]: 'test' }
//
// where - An object representing the GraphQL-safe "where" format.
//
// Returns an object transformed for Sequelize.
export function replaceWhereOperators(where: InputObject): InputObject {
  return replaceKeyDeep(where, getSequelizeOps())
}
