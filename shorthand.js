import { OP_COMPLEMENT, OP_INTERSECT, OP_UNION } from '@lejeunerenard/symbolic-sets/node-types.js'
import { SearchTermNode, SearchOperatorNode } from './tree.js'

export function convert (tree) {
  if (!(tree instanceof Array)) {
    return new SearchTermNode(tree)
  }

  const type = {
    OR: OP_UNION,
    AND: OP_INTERSECT,
    NOT: OP_COMPLEMENT
  }[tree[0]]

  switch (type) {
    case OP_UNION:
    case OP_INTERSECT:
    case OP_COMPLEMENT:
      return new SearchOperatorNode(type, tree.slice(1).map(convert))
    default:
      return new SearchTermNode(tree[0])
  }
}
