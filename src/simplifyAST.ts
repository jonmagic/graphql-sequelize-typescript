import {
  ArgumentNode,
  ASTNode,
  FragmentDefinitionNode,
  GraphQLResolveInfo,
  ObjectValueNode,
  SelectionNode,
  ValueNode,
} from 'graphql'

// Define the structure of a simplified field.
type SimplifiedField = {
  fields: Record<string, SimplifiedField>
  args: Record<string, unknown>
  key?: string
  $parent?: SimplifiedField
}

// Define the structure of the simplified AST.
type SimplifiedAST = {
  fields: Record<string, SimplifiedField>
  args: Record<string, unknown>
  [key: string]: unknown // Add index signature for dynamic properties.
}

// Public: Perform a deep merge of two SimplifiedAST objects.
//
// a - The base object to merge into.
// b - The object containing properties to merge into `a`.
//
// Returns the merged SimplifiedAST object.
function deepMerge(a: SimplifiedAST, b: SimplifiedAST): SimplifiedAST {
  Object.keys(b).forEach((key) => {
    if (key === 'fields' || key === 'args') return

    if (a[key] && b[key] && typeof a[key] === 'object' && typeof b[key] === 'object') {
      a[key] = deepMerge(a[key] as SimplifiedAST, b[key] as SimplifiedAST)
    } else {
      a[key] = b[key]
    }
  })

  if (a.fields && b.fields) {
    a.fields = { ...a.fields, ...b.fields }
  } else if (a.fields || b.fields) {
    a.fields = a.fields || b.fields
  }

  return a
}

// Public: Check if the `info` object has fragments defined.
//
// info - The GraphQLResolveInfo containing fragments.
//
// Returns `true` if fragments exist, otherwise `false`.
function hasFragments(info: GraphQLResolveInfo): boolean {
  return !!info.fragments && Object.keys(info.fragments).length > 0
}

// Public: Check if the AST node is a fragment.
//
// info - The GraphQLResolveInfo containing fragments.
// ast - The ASTNode to evaluate.
//
// Returns `true` if the node is a fragment, otherwise `false`.
function isFragment(info: GraphQLResolveInfo, ast: ASTNode): boolean {
  return (
    hasFragments(info) &&
    'name' in ast &&
    ast.name !== undefined && // Ensure ast.name is defined
    ast.name.value in info.fragments && // Ensure the name value exists in fragments
    ast.kind !== 'FragmentDefinition'
  )
}

// Public: Simplify an ObjectValueNode into a plain object.
//
// objectValue - The ObjectValueNode to simplify.
//
// Returns the simplified object.
function simplifyObjectValue(objectValue: ObjectValueNode): Record<string, unknown> {
  return objectValue.fields.reduce((memo: Record<string, unknown>, field) => {
    memo[field.name.value] =
      field.value.kind === 'IntValue'
        ? parseInt(field.value.value, 10)
        : field.value.kind === 'FloatValue'
          ? parseFloat(field.value.value)
          : field.value.kind === 'ObjectValue'
            ? simplifyObjectValue(field.value as ObjectValueNode)
            : 'value' in field.value
              ? field.value.value
              : null
    return memo
  }, {})
}

// Public: Simplify a ValueNode into a plain value.
//
// value - The ValueNode to simplify.
// info - The GraphQLResolveInfo containing variable values.
//
// Returns the simplified value.
function simplifyValue(value: ValueNode, info: GraphQLResolveInfo): unknown {
  if ('values' in value) {
    return value.values.map((v) => simplifyValue(v, info))
  }
  if ('value' in value) {
    return value.value
  }
  if (value.kind === 'ObjectValue') {
    return simplifyObjectValue(value)
  }
  if ('name' in value && info.variableValues) {
    return info.variableValues[value.name.value]
  }
  return null
}

// Public: Simplify an AST into a structured representation.
//
// ast - The ASTNode or array of ASTNodes to simplify.
// info - The GraphQLResolveInfo containing fragments and variable values.
// parent - The parent SimplifiedField (optional).
//
// Returns a simplified representation of the AST.
export default function simplifyAST(
  ast: ASTNode | ASTNode[],
  info: GraphQLResolveInfo,
  parent?: SimplifiedField,
): SimplifiedAST {
  let selections: readonly SelectionNode[] | undefined
  info = info || {}

  if ('selectionSet' in ast && ast.selectionSet) selections = ast.selectionSet.selections
  if (Array.isArray(ast)) {
    return ast.reduce((simpleAST, node) => deepMerge(simpleAST, simplifyAST(node, info)), { fields: {}, args: {} })
  }

  if (isFragment(info, ast)) {
    return simplifyAST(info.fragments[(ast as FragmentDefinitionNode).name.value], info)
  }

  if (!selections) return { fields: {}, args: {} }

  return selections.reduce<SimplifiedAST>(
    (simpleAST, selection) => {
      if (selection.kind === 'FragmentSpread' || selection.kind === 'InlineFragment') {
        return deepMerge(simpleAST, simplifyAST(selection, info))
      }

      const name = selection.name.value
      const alias = selection.alias?.value
      const key = alias || name

      if (!simpleAST.fields[key]) {
        simpleAST.fields[key] = { fields: {}, args: {} }
      }

      simpleAST.fields[key] = deepMerge(
        simpleAST.fields[key],
        simplifyAST(selection, info, simpleAST.fields[key]),
      ) as SimplifiedField

      if (alias) {
        simpleAST.fields[key].key = name
      }

      simpleAST.fields[key].args = (selection.arguments || []).reduce<Record<string, unknown>>(
        (args, arg: ArgumentNode) => {
          args[arg.name.value] = simplifyValue(arg.value, info)
          return args
        },
        {},
      )

      if (parent) {
        Object.defineProperty(simpleAST.fields[key], '$parent', { value: parent, enumerable: false })
      }

      return simpleAST
    },
    { fields: {}, args: {} },
  )
}
