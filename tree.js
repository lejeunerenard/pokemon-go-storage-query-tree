import { Null, OpNode, Term, Universal } from '@lejeunerenard/symbolic-sets'
import { OP_COMPLEMENT, OP_INTERSECT, OP_UNION } from '@lejeunerenard/symbolic-sets/node-types.js'

export class SearchTermNode extends Term {
  toSearchString () {
    return this.term + ''
  }
}

export class SearchUniversal extends Universal {
  toSearchString () {
    return '0-'
  }
}

export class SearchNull extends Null {
  toSearchString () {
    return '!0-'
  }
}

export class SearchOperatorNode extends OpNode {
  constructor () {
    super(...arguments)
    this.nodeFactory = {
      OP: SearchOperatorNode,
      TERM: SearchTermNode,
      UNIVERSAL: SearchUniversal,
      NULL: SearchNull
    }
  }

  toSearchString () {
    let separator
    switch (this.type) {
      case OP_COMPLEMENT:
        return '!' + this.children[0].toSearchString()
      case OP_UNION:
        separator = ','
        break
      case OP_INTERSECT:
        separator = '&'
        break
    }
    return this.children.map((node) => node.toSearchString()).join(separator)
  }
}
