import { Null, OpNode, Term, Universal } from '@lejeunerenard/symbolic-sets'
import { OP_COMPLEMENT, OP_INTERSECT, OP_UNION } from '@lejeunerenard/symbolic-sets/node-types.js'
const inspect = Symbol.for('nodejs.util.inspect.custom')

export const INTERVAL = Symbol('INTERVAL')

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

export class SearchIntervalNode extends SearchTermNode {
  constructor (term, lowerBound, upperBound) {
    super(term)
    this.type = INTERVAL
    this.lowerBound = lowerBound
    this.upperBound = upperBound
    if (this.lowerBound === undefined && this.upperBound === undefined) throw Error('found undefined')
  }

  [inspect] (depth, opts) {
    let indent = ''
    if (typeof opts.indentationLvl === 'number') {
      while (indent.length < opts.indentationLvl) indent += ' '
    }

    return this.constructor.name + '(\n' +
      indent + '  type: ' + opts.stylize(this.type.toString(), 'symbol') + '\n' +
      indent + '  term: ' + opts.stylize(this.term, 'string') + '\n' +
      indent + '  lowerBound: ' + opts.stylize(this.lowerBound, 'number') + '\n' +
      indent + '  upperBound: ' + opts.stylize(this.upperBound, 'number') + '\n' +
      indent + ')'
  }

  isInvertable () {
    return this.term && ['attack', 'defense', 'hp'].indexOf(this.term.toLowerCase()) !== -1
  }

  invert () {
    if (!this.isInvertable()) {
      return this
    }

    // Get Min & Max
    let min, max
    switch (this.term.toLowerCase()) {
      case 'attack':
      case 'defense':
      case 'hp':
        min = 0
        max = 4
        break
    }

    // Original interval covered the whole range
    if (this.lowerBound === min && this.upperBound === max) {
      return new SearchNull()
    }

    // Lower "Bookend" to Upper "Bookend"
    if (this.lowerBound === min && this.upperBound < max) {
      return new SearchIntervalNode(this.term, this.upperBound + 1, max)
    }

    // Upper "Bookend" to Lower "Bookend"
    if (this.lowerBound <= max && this.upperBound === max) {
      return new SearchIntervalNode(this.term, min, this.lowerBound - 1)
    }

    // Split range
    return new SearchOperatorNode(OP_UNION, [
      new SearchIntervalNode(this.term, min, this.lowerBound - 1),
      new SearchIntervalNode(this.term, this.upperBound + 1, max)
    ])
  }

  simplify () {
    const term = this.term ? this.term.toLowerCase() : null
    switch (term) {
      case 'attack':
      case 'defense':
      case 'hp':
        if (this.lowerBound === 0 && this.upperBound === 4) {
          return new this.nodeFactory.UNIVERSAL()
        }
        return new this.constructor(this.term, this.lowerBound, this.upperBound)
      default:
        return new this.constructor(this.term, this.lowerBound, this.upperBound)
    }
  }

  isSimple () {
    return true
  }

  toCNF () {
    return new this.constructor(this.term, this.lowerBound, this.upperBound)
  }

  toSearchString () {
    let prefix = ''

    if (this.lowerBound === this.upperBound) {
      prefix = this.lowerBound
    } else {
      const rangeItems = []
      if (this.lowerBound) rangeItems.push(this.lowerBound)
      rangeItems.push('-')
      if (this.upperBound) rangeItems.push(this.upperBound)

      prefix = rangeItems.join('')
    }

    return prefix + (this.term || '')
  }

  toString () {
    return this.toSearchString()
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

  [inspect] (depth, opts, inspect) {
    let indent = ''
    if (typeof opts.indentationLvl === 'number') {
      while (indent.length < opts.indentationLvl) indent += ' '
    }

    const newOpts = Object.assign({}, opts, {
      depth: opts.depth === null ? null : opts.depth - 1
    })

    return this.constructor.name + '(\n' +
      indent + '  type: ' + opts.stylize(this.type.toString(), 'symbol') + '\n' +
      indent + '  children: ' + inspect(this.children, newOpts).replace(/\n/g, `\n${indent}${indent}`) + '\n' +
      indent + ')'
  }

  simplify () {
    const result = super.simplify()
    if (result.type === OP_COMPLEMENT && result.children[0].type === INTERVAL && result.children[0].isInvertable()) {
      return result.children[0].invert()
    }

    if (result.type === OP_UNION || result.type === OP_INTERSECT) {
      const { interval, nonInterval } = result.children.reduce((accum, child) => {
        if (child.type === INTERVAL) {
          accum.interval[child.term] = accum.interval[child.term] || []
          let mergedChild = false
          for (let i = 0; i < accum.interval[child.term].length; i++) {
            const node = accum.interval[child.term][i]
            if (child.lowerBound - 1 <= node.upperBound && child.upperBound >= node.lowerBound - 1) {
              if (result.type === OP_UNION) {
                node.lowerBound = Math.min(node.lowerBound, child.lowerBound)
                node.upperBound = Math.max(node.upperBound, child.upperBound)
              } else {
                node.lowerBound = Math.max(node.lowerBound, child.lowerBound)
                node.upperBound = Math.min(node.upperBound, child.upperBound)
              }
              if (i < accum.interval[child.term].length - 1) {
                const next = accum.interval[child.term][i + 1]
                if (node.lowerBound - 1 <= next.upperBound && node.upperBound >= next.lowerBound - 1) {
                  if (result.type === OP_UNION) {
                    node.lowerBound = Math.min(node.lowerBound, next.lowerBound)
                    node.upperBound = Math.max(node.upperBound, next.upperBound)
                    // Cut out next since it was merged
                    accum.interval[child.term].splice(i + 1, 1)
                  }
                }
              }
              mergedChild = true
              break
            } else if (child.upperBound < node.lowerBound) {
              accum.interval[child.term].splice(i, 0, child)
              mergedChild = true
              break
            }
          }

          if (!mergedChild) accum.interval[child.term].push(child)
        } else {
          accum.nonInterval.push(child)
        }

        return accum
      }, { interval: {}, nonInterval: [] })
      if (Object.keys(interval).length) {
        const intervalChildren = Object.keys(interval).flatMap((key) => interval[key])
        result.children = nonInterval.concat(intervalChildren)
      }

      if (result.children.length < 2) {
        return result.children[0]
      }
    }

    return result
  }

  toSearchString () {
    const cnfForm = this.toCNF()
    let separator
    switch (cnfForm.type) {
      case OP_COMPLEMENT:
        return '!' + cnfForm.children[0].toSearchString()
      case OP_UNION:
        separator = ','
        break
      case OP_INTERSECT:
        separator = '&'
        break
    }
    return cnfForm.children.map((node) => node.toSearchString()).join(separator)
  }
}

export class SearchIntersectNode extends SearchOperatorNode {
  constructor (children) {
    super(OP_INTERSECT, children)
  }
}

export class SearchUnionNode extends SearchOperatorNode {
  constructor (children) {
    super(OP_UNION, children)
  }
}

export class SearchComplimentNode extends SearchOperatorNode {
  constructor (child) {
    super(OP_COMPLEMENT, [child])
  }
}
