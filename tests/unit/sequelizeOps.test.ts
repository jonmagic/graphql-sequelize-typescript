import { Op } from 'sequelize'
import { describe, expect, it } from 'vitest'
import getSequelizeOps from '../../src/sequelizeOps.js'

describe('getSequelizeOps', () => {
  it('should return an object mapping Sequelize operators to symbols', () => {
    const ops = getSequelizeOps()

    // Validate that common operators are present
    expect(ops.eq).toBe(Op.eq)
    expect(ops.ne).toBe(Op.ne)
    expect(ops.gte).toBe(Op.gte)
    expect(ops.lt).toBe(Op.lt)
    expect(ops.and).toBe(Op.and)
    expect(ops.or).toBe(Op.or)
  })
})
