import { Op } from 'sequelize'
import { describe, expect, it } from 'vitest'
import { replaceWhereOperators } from '../../src/replaceWhereOperators.js'

describe('replaceWhereOperators', () => {
  it('should replace GraphQL-friendly keys with Sequelize operators', () => {
    const before = {
      and: 1,
      or: '1',
      gt: [
        { and: '1', or: '1' },
        { between: '1', overlap: '1' },
      ],
      lt: {
        and: {
          test: [{ or: '1' }],
        },
      },
    }

    const after = {
      [Op.and]: 1,
      [Op.or]: '1',
      [Op.gt]: [
        {
          [Op.and]: '1',
          [Op.or]: '1',
        },
        {
          [Op.between]: '1',
          [Op.overlap]: '1',
        },
      ],
      [Op.lt]: {
        [Op.and]: {
          test: [{ [Op.or]: '1' }],
        },
      },
    }

    expect(replaceWhereOperators(before)).toEqual(after)
  })

  it('should not mutate the original argument', () => {
    const before = {
      prop1: { gt: 12 },
      prop2: { or: [{ eq: 3 }, { eq: 4 }] },
    }

    const proxify = (target: Record<string, unknown>) =>
      new Proxy(target, {
        get(target, prop) {
          const value = target[prop as keyof typeof target]
          return typeof value === 'object' ? proxify(value as Record<string, unknown>) : value
        },
        set() {
          throw new Error('Attempted to mutate argument')
        },
      })

    const after = {
      prop1: { [Op.gt]: 12 },
      prop2: { [Op.or]: [{ [Op.eq]: 3 }, { [Op.eq]: 4 }] },
    }

    expect(replaceWhereOperators(proxify(before))).toEqual(after)
  })
})
