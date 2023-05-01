import { SearchTermNode, SearchOperatorNode } from './tree.js'
import { OPERATOR_OR, OPERATOR_AND } from './node-types.js'

export function convert (tree) {
  if (!(tree instanceof Array)) {
    return new SearchTermNode(tree)
  }

  const type = {
    OR: OPERATOR_OR,
    AND: OPERATOR_AND
  }[tree[0]]

  switch (type) {
    case OPERATOR_OR:
    case OPERATOR_AND:
      return new SearchOperatorNode(type, tree.slice(1).map(convert))
    default:
      return new SearchTermNode(tree[0])
  }
}
