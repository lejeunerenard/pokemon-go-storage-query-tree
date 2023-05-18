import test from 'tape'
import { OP_INTERSECT, OP_UNION, TERM, OP_COMPLEMENT } from '@lejeunerenard/symbolic-sets/node-types.js'
import { SearchTermNode, SearchOperatorNode, SearchIntervalNode, INTERVAL } from '../tree.js'

test('SearchTermNode', (t) => {
  t.test('constructor', (t) => {
    const node = new SearchTermNode('beep')

    t.is(node.type, TERM, 'sets type')
    t.is(node.term, 'beep', 'sets term')
    t.deepEquals(node.children, [], 'sets children')
    t.end()
  })

  t.test('toSearchString()', (t) => {
    const node = new SearchTermNode('beep')

    t.is(node.toSearchString(), node.term)
    t.end()
  })

  t.test('simplify()', (t) => {
    const node = new SearchTermNode('beep')

    t.ok(node.simplify() instanceof SearchTermNode, 'returns SearchTermNode')
    t.is(node.simplify().term, node.term, 'returns same term')
    t.end()
  })
})

test('SearchIntervalNode', (t) => {
  t.test('constructor', (t) => {
    const node = new SearchIntervalNode('beep', 1, 10)

    t.is(node.type, INTERVAL, 'sets type to INTERVAL')
    t.is(node.term, 'beep', 'sets term')
    t.is(node.lowerBound, 1, 'sets lower bound')
    t.is(node.upperBound, 10, 'sets upper bound')
    t.deepEquals(node.children, [], 'sets empty children')
    t.end()
  })

  t.test('toSearchString()', (t) => {
    const lowerBoundTerm = new SearchIntervalNode('beep', 1)
    t.is(lowerBoundTerm.toSearchString(), '1-beep')

    const upperBoundTerm = new SearchIntervalNode('beep', null, 10)
    t.is(upperBoundTerm.toSearchString(), '-10beep')

    const lowerUpperBoundTerm = new SearchIntervalNode('beep', 2, 10)
    t.is(lowerUpperBoundTerm.toSearchString(), '2-10beep')

    const lowerBound = new SearchIntervalNode(null, 2)
    t.is(lowerBound.toSearchString(), '2-')

    const upperBound = new SearchIntervalNode(null, null, 100)
    t.is(upperBound.toSearchString(), '-100')

    t.end()
  })

  t.test('simplify()', (t) => {
    t.test('basic', (t) => {
      const node = new SearchIntervalNode('beep', 1, 2)

      t.ok(node.simplify() instanceof SearchIntervalNode, 'returns SearchTermNode')
      t.is(node.simplify().term, node.term, 'returns same term')
      t.end()
    })

    t.test('UNION', (t) => {
      const sameTerm = new SearchOperatorNode(OP_UNION, [
        new SearchIntervalNode('attack', 0, 1),
        new SearchIntervalNode('attack', 1, 3)
      ])

      t.deepEquals(sameTerm.simplify(), new SearchIntervalNode('attack', 0, 3), 'returns union of interval as single node')

      const barelyOverlap = new SearchOperatorNode(OP_UNION, [
        new SearchIntervalNode('attack', 0, 1),
        new SearchIntervalNode('attack', 2, 3)
      ])

      t.deepEquals(barelyOverlap.simplify(), new SearchIntervalNode('attack', 0, 3), 'returns union of barely overlapping intervals')
      const barelyOverlap2 = new SearchOperatorNode(OP_UNION, [
        new SearchIntervalNode('attack', 2, 3),
        new SearchIntervalNode('attack', 0, 1)
      ])

      t.deepEquals(barelyOverlap2.simplify(), new SearchIntervalNode('attack', 0, 3), 'returns union of barely overlapping intervals reversed')

      const noOverlap = new SearchOperatorNode(OP_UNION, [
        new SearchIntervalNode('attack', 0, 1),
        new SearchIntervalNode('attack', 3, 4)
      ])

      t.deepEquals(noOverlap.simplify(), new SearchOperatorNode(OP_UNION, [
        new SearchIntervalNode('attack', 0, 1),
        new SearchIntervalNode('attack', 3, 4)
      ]), 'union of non-overlapping intervals returns original')

      const cascadeOverlap = new SearchOperatorNode(OP_UNION, [
        new SearchIntervalNode('attack', 0, 1),
        new SearchIntervalNode('attack', 2, 3),
        new SearchIntervalNode('attack', 1, 2)
      ])

      t.deepEquals(cascadeOverlap.simplify(), new SearchIntervalNode('attack', 0, 3), 'union cascades')

      t.end()
    })

    t.test('complement of interval for stats', (t) => {
      const node = new SearchOperatorNode(OP_COMPLEMENT, [
        new SearchIntervalNode('attack', 0, 2)
      ])

      t.deepEquals(node.simplify(), new SearchIntervalNode('attack', 3, 4), 'simple inverse')

      const complicatedNode = new SearchOperatorNode(OP_COMPLEMENT, [
        new SearchIntervalNode('defense', 1, 2)
      ])

      t.deepEquals(complicatedNode.simplify(), new SearchOperatorNode(OP_UNION, [
        new SearchIntervalNode('defense', 0, 0),
        new SearchIntervalNode('defense', 3, 4)
      ]), 'extremes inverse')

      const not4 = new SearchOperatorNode(OP_COMPLEMENT, [
        new SearchIntervalNode('hp', 4, 4)
      ])

      t.deepEquals(not4.simplify(), new SearchIntervalNode('hp', 0, 3), 'not 4 stat')
      t.end()
    })

    t.test('toCNF', (t) => {
      const sameTerm = new SearchOperatorNode(OP_UNION, [
        new SearchIntervalNode('attack', 0, 1),
        new SearchOperatorNode(OP_INTERSECT, [
          new SearchIntervalNode('hp', 0, 1),
          new SearchIntervalNode('attack', 1, 3)
        ])]
      )

      const expected = new SearchOperatorNode(OP_INTERSECT, [
        new SearchOperatorNode(OP_UNION, [
          new SearchIntervalNode('attack', 0, 1),
          new SearchIntervalNode('hp', 0, 1)
        ]),
        new SearchIntervalNode('attack', 0, 3)
      ])
      t.deepEquals(sameTerm.toCNF(), expected, 'returns union of interval through distribution')

      t.end()
    })
  })
})

test('SearchOperatorNode', (t) => {
  t.test('constructor', (t) => {
    const node = new SearchOperatorNode(OP_UNION, [
      new SearchTermNode('beep'),
      new SearchTermNode('boop')
    ])

    t.is(node.type, OP_UNION, 'sets type')
    t.end()
  })

  t.test('OR', (t) => {
    t.test('toSearchString()', (t) => {
      const node = new SearchOperatorNode(OP_UNION, [
        new SearchTermNode('beep'),
        new SearchTermNode('boop')
      ])

      t.is(node.toSearchString(), 'beep,boop')
      t.end()
    })
  })

  t.test('AND', (t) => {
    t.test('toSearchString()', (t) => {
      const node = new SearchOperatorNode(OP_INTERSECT, [
        new SearchTermNode('beep'),
        new SearchTermNode('boop')
      ])

      t.is(node.toSearchString(), 'beep&boop')
      t.end()
    })
  })
})
