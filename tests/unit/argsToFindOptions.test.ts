import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the replaceWhereOperators module BEFORE importing argsToFindOptions
vi.mock('../../src/replaceWhereOperators.ts', () => {
  return {
    replaceWhereOperators: vi.fn().mockReturnValue({ id: 1 }),
  }
})

// Import the module under test AFTER mocking
import argsToFindOptions, { Args, FindOptions } from '../../src/argsToFindOptions.js'
import { replaceWhereOperators } from '../../src/replaceWhereOperators.ts'

describe('argsToFindOptions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should parse limit and offset as numbers', () => {
    const args: Args = { limit: '10', offset: '5' }
    const options: FindOptions = argsToFindOptions(args, [])
    expect(options).toEqual({ limit: 10, offset: 5 })
  })

  it('should parse order with ascending and descending directions', () => {
    const args: Args = { order: 'reverse:name' }
    const options: FindOptions = argsToFindOptions(args, [])
    expect(options).toEqual({ order: [['name', 'DESC']] })

    const args2: Args = { order: 'name' }
    const options2: FindOptions = argsToFindOptions(args2, [])
    expect(options2).toEqual({ order: [['name', 'ASC']] })
  })

  it('should handle where clause with replaceWhereOperators', () => {
    const args: Args = { where: { id: 1 } }
    const options: FindOptions = argsToFindOptions(args, [])
    expect(replaceWhereOperators).toHaveBeenCalledWith({ id: 1 })
    expect(options.where).toEqual({ id: 1 })
  })

  it('should add target attributes to the where clause', () => {
    const args: Args = { name: 'test' }
    const targetAttributes = ['name']
    const options: FindOptions = argsToFindOptions(args, targetAttributes)
    expect(options).toEqual({ where: { name: 'test' } })
  })

  it('should ignore keys not in target attributes', () => {
    const args: Args = { randomKey: 'value' }
    const targetAttributes = ['name']
    const options: FindOptions = argsToFindOptions(args, targetAttributes)
    expect(options).toEqual({})
  })
})
