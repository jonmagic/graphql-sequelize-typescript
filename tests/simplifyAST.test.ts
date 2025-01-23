import { describe, it, expect } from 'vitest'
import { parse, DocumentNode, GraphQLResolveInfo } from 'graphql'
import simplifyAST from '../src/simplifyAST.js'

// Helper function to parse GraphQL queries and extract the first definition
const gql = (query: string): DocumentNode['definitions'][0] => parse(query).definitions[0]

describe('simplifyAST', () => {
  // Existing tests
  it('should simplify a basic nested structure', () => {
    const result = simplifyAST(
      gql(`
        {
          users {
            name
            projects {
              name
            }
          }
        }
      `),
      {} as GraphQLResolveInfo,
    )
    expect(result).toEqual({
      args: {},
      fields: {
        users: {
          args: {},
          fields: {
            name: {
              args: {},
              fields: {},
            },
            projects: {
              args: {},
              fields: {
                name: {
                  args: {},
                  fields: {},
                },
              },
            },
          },
        },
      },
    })
  })

  it('should simplify a basic structure with args', () => {
    const result = simplifyAST(
      gql(`
        {
          user(id: 1) {
            name
          }
        }
      `),
      {} as GraphQLResolveInfo,
    )
    expect(result).toEqual({
      args: {},
      fields: {
        user: {
          args: {
            id: '1',
          },
          fields: {
            name: {
              args: {},
              fields: {},
            },
          },
        },
      },
    })
  })

  it('should simplify a basic structure with array args', () => {
    const result = simplifyAST(
      gql(`
        {
          luke: human(id: ["1000", "1003"]) {
            name
          }
        }
      `),
      {} as GraphQLResolveInfo,
    )
    expect(result).toEqual({
      args: {},
      fields: {
        luke: {
          key: 'human',
          args: {
            id: ['1000', '1003'],
          },
          fields: {
            name: {
              args: {},
              fields: {},
            },
          },
        },
      },
    })
  })

  it('should simplify a basic structure with object args', () => {
    const result = simplifyAST(
      gql(`
        {
          luke: human(contact: { phone: "91264646" }) {
            name
          }
        }
      `),
      {} as GraphQLResolveInfo,
    )
    expect(result).toEqual({
      args: {},
      fields: {
        luke: {
          key: 'human',
          args: {
            contact: { phone: '91264646' },
          },
          fields: {
            name: {
              args: {},
              fields: {},
            },
          },
        },
      },
    })
  })

  it('should simplify a basic structure with nested array args', () => {
    const result = simplifyAST(
      gql(`
        {
          user(units: ["1", "2", ["3", ["4"], [["5"], "6"], "7"]]) {
            name
          }
        }
      `),
      {} as GraphQLResolveInfo,
    )
    expect(result).toEqual({
      args: {},
      fields: {
        user: {
          args: {
            units: ['1', '2', ['3', ['4'], [['5'], '6'], '7']],
          },
          fields: {
            name: {
              args: {},
              fields: {},
            },
          },
        },
      },
    })
  })

  it('should simplify a basic structure with variable args', () => {
    const variableValues: Record<string, unknown> = {
      id: '1',
    }

    const result = simplifyAST(
      gql(`
        {
          user(id: $id) {
            name
          }
        }
      `),
      { variableValues } as unknown as GraphQLResolveInfo,
    )
    expect(result).toEqual({
      args: {},
      fields: {
        user: {
          args: {
            id: '1',
          },
          fields: {
            name: {
              args: {},
              fields: {},
            },
          },
        },
      },
    })
  })

  it('should simplify a basic structure with an inline fragment', () => {
    const result = simplifyAST(
      gql(`
        {
          user {
            ... on User {
              name
            }
          }
        }
      `),
      {} as GraphQLResolveInfo,
    )
    expect(result).toEqual({
      args: {},
      fields: {
        user: {
          args: {},
          fields: {
            name: {
              args: {},
              fields: {},
            },
          },
        },
      },
    })
  })

  it('should expose a $parent', () => {
    const result = simplifyAST(
      gql(`
        {
          users {
            name
            projects(first: 1) {
              nodes {
                name
              }
            }
          }
        }
      `),
      {} as GraphQLResolveInfo,
    )

    expect(result.fields.users.fields.projects.fields.nodes.$parent).toBeDefined()
    expect(result.fields.users.fields.projects.fields.nodes.$parent?.args).toEqual({
      first: '1',
    })
  })

  it('should simplify a structure with aliases', () => {
    const result = simplifyAST(
      gql(`
        {
          luke: human(id: "1000") {
            name
          }
          leia: human(id: "1003") {
            firstName: name
          }
        }
      `),
      {} as GraphQLResolveInfo,
    )
    expect(result).toEqual({
      args: {},
      fields: {
        luke: {
          key: 'human',
          args: {
            id: '1000',
          },
          fields: {
            name: {
              args: {},
              fields: {},
            },
          },
        },
        leia: {
          key: 'human',
          args: {
            id: '1003',
          },
          fields: {
            firstName: {
              key: 'name',
              args: {},
              fields: {},
            },
          },
        },
      },
    })
  })

  // New tests
  it('should handle empty selection sets', () => {
    const result = simplifyAST(
      gql(`
        {
          user
        }
      `),
      {} as GraphQLResolveInfo,
    )
    expect(result).toEqual({
      args: {},
      fields: {
        user: {
          args: {},
          fields: {},
        },
      },
    })
  })

  it('should handle deeply nested object args', () => {
    const result = simplifyAST(
      gql(`
        {
          user(contact: { details: { phone: "123", address: { city: "NYC" } } }) {
            name
          }
        }
      `),
      {} as GraphQLResolveInfo,
    )
    expect(result).toEqual({
      args: {},
      fields: {
        user: {
          args: {
            contact: { details: { phone: '123', address: { city: 'NYC' } } },
          },
          fields: {
            name: {
              args: {},
              fields: {},
            },
          },
        },
      },
    })
  })

  it('should simplify a query with multiple root-level fields', () => {
    const result = simplifyAST(
      gql(`
        {
          user {
            name
          }
          post {
            title
          }
        }
      `),
      {} as GraphQLResolveInfo,
    )
    expect(result).toEqual({
      args: {},
      fields: {
        user: {
          args: {},
          fields: {
            name: {
              args: {},
              fields: {},
            },
          },
        },
        post: {
          args: {},
          fields: {
            title: {
              args: {},
              fields: {},
            },
          },
        },
      },
    })
  })
})
