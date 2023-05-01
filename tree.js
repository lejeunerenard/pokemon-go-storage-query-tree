import { OPERATOR_OR, OPERATOR_AND, TERM } from './node-types.js'

export function distribute (node) {
  if (node.type !== OPERATOR_OR && node.type !== OPERATOR_AND) {
    return node
  }

  const originalType = node.type
  const newOp = originalType === OPERATOR_OR ? OPERATOR_AND : OPERATOR_OR

  const accumulatorChildren = []
  const diffrentTypeChildren = []
  for (const child of node.children) {
    if (child.type === newOp) {
      diffrentTypeChildren.push(child)
    } else {
      accumulatorChildren.push(child)
    }
  }

  if (diffrentTypeChildren.length === 0) return node

  let left
  if (accumulatorChildren.length === 0) {
    left = diffrentTypeChildren.shift()
  } else if (accumulatorChildren.length === 1) {
    left = accumulatorChildren[0]
  } else {
    left = new SearchOperatorNode(originalType, accumulatorChildren)
  }

  return diffrentTypeChildren.reduce((accum, right) => {
    const distributedChildren = right.children.map((node) => {
      const result = new SearchOperatorNode(originalType, [accum, node])
      return accum.type === newOp ? distribute(result) : result
    })

    return new SearchOperatorNode(newOp, distributedChildren)
  }, left)
}

export class SearchNode {
  constructor (type, children = []) {
    this.type = type
    this.children = children
  }

  simplify () {
    throw Error('simplify() not implemented')
  }

  toSearchString () {
    throw Error('toSearchString() not implemented')
  }
}

export class SearchTermNode extends SearchNode {
  constructor (term) {
    super(TERM)
    this.term = term
  }

  simplify () {
    return new SearchTermNode(this.term)
  }

  toSearchString () {
    return this.term
  }

  toCNF () {
    return new SearchTermNode(this.term)
  }
}

export class SearchOperatorNode extends SearchNode {
  constructor (type, children) {
    super(type, children)

    if (type !== OPERATOR_OR && type !== OPERATOR_AND) {
      throw Error('Only "OR" & "AND" operators are supported')
    }

    if (children.length < 2) {
      console.error('type', type, 'children', children)
      throw Error('Operators must have at least two children')
    }
  }

  simplify () {
    const simpleChildren = this.children.map((node) => node.simplify())

    // Flatten
    const flattenedChildren = simpleChildren.flatMap((child) =>
      child.type === this.type ? child.children : child)

    // Idempotent Laws via uniqueness
    const uniq = {}
    const uniqChildren = flattenedChildren.flatMap((node) => {
      if (node.type === TERM) {
        if (node.term in uniq) return []
        uniq[node.term] = true
      }
      return node
    })
    if (uniqChildren.length === 1) return uniqChildren[0]

    return new SearchOperatorNode(this.type, uniqChildren)
  }

  toSearchString () {
    let separator
    switch (this.type) {
      case OPERATOR_OR:
        separator = ','
        break
      case OPERATOR_AND:
        separator = '&'
        break
    }
    return this.children.map((node) => node.toSearchString()).join(separator)
  }

  toCNF () {
    const simple = this.simplify()
    const cnfChildren = simple.children.map((node) => node.toCNF())

    // Distributive Law
    if (simple.type === OPERATOR_OR && cnfChildren.some((node) => node.type === OPERATOR_AND)) {
      return distribute(new SearchOperatorNode(simple.type, cnfChildren))
    }

    return new SearchOperatorNode(simple.type, cnfChildren)
  }
}
