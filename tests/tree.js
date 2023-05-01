import test from 'tape'
import { SearchNode, SearchTermNode, SearchOperatorNode, distribute } from '../tree.js'
import { OPERATOR_OR, OPERATOR_AND, TERM } from '../node-types.js'
import util from 'util'

test('distribute', (t) => {
  t.test('simple', (t) => {
    const start = new SearchOperatorNode(OPERATOR_OR, [
      new SearchTermNode('a'),
      new SearchOperatorNode(OPERATOR_AND, [
        new SearchTermNode('b'),
        new SearchTermNode('c')
      ])
    ])

    t.deepEquals(distribute(start), new SearchOperatorNode(OPERATOR_AND, [
      new SearchOperatorNode(OPERATOR_OR, [
        new SearchTermNode('a'),
        new SearchTermNode('b')
      ]),
      new SearchOperatorNode(OPERATOR_OR, [
        new SearchTermNode('a'),
        new SearchTermNode('c')
      ])
    ]))
    t.end()
  })
})
test('SearchNode', (t) => {
  t.test('constructor', (t) => {
    const child = new SearchNode(OPERATOR_OR)
    const node = new SearchNode(OPERATOR_AND, [child])

    t.is(node.type, OPERATOR_AND, 'sets type')
    t.deepEquals(node.children, [child], 'sets children')
    t.end()
  })
})

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
})

test('SearchOperatorNode', (t) => {
  t.test('constructor', (t) => {
    const node = new SearchOperatorNode(OPERATOR_OR, [
      new SearchTermNode('beep'),
      new SearchTermNode('boop')
    ])

    t.is(node.type, OPERATOR_OR, 'sets type')
    t.end()
  })

  t.test('OR', (t) => {
    t.test('toSearchString()', (t) => {
      const node = new SearchOperatorNode(OPERATOR_OR, [
        new SearchTermNode('beep'),
        new SearchTermNode('boop')
      ])

      t.is(node.toSearchString(), 'beep,boop')
      t.end()
    })

    t.test('toCNF', (t) => {
      t.test('naive', (t) => {
        const node = new SearchOperatorNode(OPERATOR_OR, [
          new SearchTermNode('beep'),
          new SearchTermNode('boop')
        ])

        const cnfNode = node.toCNF()

        t.is(cnfNode.type, OPERATOR_OR, 'new node is OR')
        t.deepEquals(cnfNode.children, node.children, 'new node is the same')
        t.end()
      })

      t.test('distributive law', (t) => {
        const node = new SearchOperatorNode(OPERATOR_OR, [
          new SearchTermNode('a'),
          new SearchOperatorNode(OPERATOR_AND, [
            new SearchTermNode('b'),
            new SearchTermNode('c')
          ])
        ])

        const cnfNode = node.toCNF()

        const expected = new SearchOperatorNode(OPERATOR_AND, [
          new SearchOperatorNode(OPERATOR_OR, [
            new SearchTermNode('a'),
            new SearchTermNode('b')
          ]),
          new SearchOperatorNode(OPERATOR_OR, [
            new SearchTermNode('a'),
            new SearchTermNode('c')
          ])
        ])

        t.is(cnfNode.type, OPERATOR_AND, 'top node is AND')
        t.deepEquals(cnfNode, expected, 'an AND of ORs')

        // // TODO correct below to test distributing across OR of multiple ANDs
        // const multiAnd = new SearchOperatorNode(OPERATOR_OR, [
        //   new SearchTermNode('a'),
        //   new SearchOperatorNode(OPERATOR_AND, [
        //     new SearchTermNode('b'),
        //     new SearchTermNode('c')
        //   ]),
        //   new SearchOperatorNode(OPERATOR_AND, [
        //     new SearchTermNode('d'),
        //     new SearchTermNode('e')
        //   ])
        // ])

        // const multiAndCnfNode = multiAnd.toCNF()

        // const multiAndExpected = new SearchOperatorNode(OPERATOR_AND, [
        //   new SearchOperatorNode(OPERATOR_AND, [
        //     new SearchOperatorNode(OPERATOR_OR, [
        //       new SearchTermNode('a'),
        //       new SearchTermNode('b')
        //     ]),
        //     new SearchOperatorNode(OPERATOR_OR, [
        //       new SearchTermNode('a'),
        //       new SearchTermNode('c')
        //     ])
        //   ]),
        //   new SearchOperatorNode(OPERATOR_AND, [
        //     new SearchOperatorNode(OPERATOR_OR, [
        //       new SearchTermNode('a'),
        //       new SearchTermNode('d')
        //     ]),
        //     new SearchOperatorNode(OPERATOR_OR, [
        //       new SearchTermNode('a'),
        //       new SearchTermNode('e')
        //     ])
        //   ])
        // ])

        // t.is(multiAndCnfNode.type, OPERATOR_AND, 'top node is still AND')
        // t.deepEquals(multiAndCnfNode, multiAndExpected, 'an AND of ANDs of ORs')

        // OR of ANDs
        const orOfAnds = new SearchOperatorNode(OPERATOR_OR, [
          new SearchOperatorNode(OPERATOR_AND, [
            new SearchTermNode('a'),
            new SearchTermNode('b')
          ]),
          new SearchOperatorNode(OPERATOR_AND, [
            new SearchTermNode('c'),
            new SearchTermNode('d')
          ])
        ])

        t.deepEquals(orOfAnds.toCNF().simplify(), new SearchOperatorNode(OPERATOR_AND, [
          new SearchOperatorNode(OPERATOR_OR, [
            new SearchTermNode('c'),
            new SearchTermNode('a')
          ]),
          new SearchOperatorNode(OPERATOR_OR, [
            new SearchTermNode('c'),
            new SearchTermNode('b')
          ]),
          new SearchOperatorNode(OPERATOR_OR, [
            new SearchTermNode('d'),
            new SearchTermNode('a')
          ]),
          new SearchOperatorNode(OPERATOR_OR, [
            new SearchTermNode('d'),
            new SearchTermNode('b')
          ])
        ]), 'distributes composite children')
        t.end()
      })
    })
  })

  t.test('AND', (t) => {
    t.test('toSearchString()', (t) => {
      const node = new SearchOperatorNode(OPERATOR_AND, [
        new SearchTermNode('beep'),
        new SearchTermNode('boop')
      ])

      t.is(node.toSearchString(), 'beep&boop')
      t.end()
    })

    t.test('toCNF', (t) => {
      t.test('naive', (t) => {
        const node = new SearchOperatorNode(OPERATOR_AND, [
          new SearchTermNode('beep'),
          new SearchTermNode('boop')
        ])

        const cnfNode = node.toCNF()

        t.is(cnfNode.type, OPERATOR_AND, 'new node is AND')
        t.deepEquals(cnfNode.children, node.children, 'new node is the same')
        t.end()
      })
    })
  })

  t.test('simplify', (t) => {
    t.test('noop', (t) => {
      const node = new SearchOperatorNode(OPERATOR_AND, [
        new SearchTermNode('beep'),
        new SearchTermNode('boop')
      ])

      t.deepEquals(node.simplify(), node, 'AND noop')

      const orNode = new SearchOperatorNode(OPERATOR_OR, [
        new SearchTermNode('beep'),
        new SearchTermNode('boop')
      ])

      t.deepEquals(orNode.simplify(), orNode, 'OR noop')
      t.end()
    })

    t.test('flattens same type', (t) => {
      const node = new SearchOperatorNode(OPERATOR_AND, [
        new SearchTermNode('a'),
        new SearchOperatorNode(OPERATOR_AND, [
          new SearchTermNode('b'),
          new SearchTermNode('c')
        ])
      ])

      t.deepEquals(node.simplify(), new SearchOperatorNode(OPERATOR_AND, [
        new SearchTermNode('a'),
        new SearchTermNode('b'),
        new SearchTermNode('c')
      ]), 'AND flattens')

      t.end()
    })
  })
})
