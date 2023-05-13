import test from 'tape'
import { OP_INTERSECT, OP_UNION, TERM } from '@lejeunerenard/symbolic-sets/node-types.js'
import { SearchTermNode, SearchOperatorNode } from '../tree.js'

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
