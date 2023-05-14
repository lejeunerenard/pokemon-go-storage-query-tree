# Pokemon Go Storage Query Tree

This library creates a tree representation of a query in Pokemon Go's storage
and allows manipulation of that tree.

This library uses set theory operators instead of boolean operators as thinking
in terms of sets matches the idea that a term represents a collection of
Pokemon.

## Usage

```js
import { SearchTermNode, SearchUnionNode, SearchIntersectNode } from 'pokemon-go-storage-query-tree'

// 134,(135&shiny)
const query = new SearchUnionNode([
  new SearchTermNode(134),
  new SearchIntersectNode([
    new SearchTermNode(135),
    new SearchTermNode('shiny')
  ]),
])

console.log(query.toSearchString()) // Logs "134,135&134,shiny"
```

## Install

```sh
npm install lejeunerenard/pokemon-go-storage-query-tree
```

## API

### Nodes

#### `new SearchTermNode(term)`

A node that represents a simple query `term` such as `shiny`, `@fire`, `lucky`,
`costume`, etc.

#### `new SearchUnionNode(children)`

A `,` query node which joins multiple sets of Pokemon into one group. For
example `electric,@weather`.

`children` is an array of 2 or more nodes to be joined.

An example for `electric,@weather` would be:

```js
new SearchUnionNode([
  new SearchTermNode('electric'),
  new SearchTermNode('@weather'),
])
```

#### `new SearchIntersectNode(children)`

A `&` query node which intersects multiple sets of Pokemon effectively narrowing
the search results. For example `grass&evolve`.

`children` is an array of 2 or more nodes to be intersected.

An example for `grass&evolve` would be:

```js
new SearchIntersectNode([
  new SearchTermNode('grass'),
  new SearchTermNode('evolve'),
])
```

#### `new SearchComplimentNode(child)`

A `!` query node which excludes a set of Pokemon (`child`). For example `!defender`.

`child` is a node to take the compliment of. Unlike in Pokemon Go, this `child`
can be a composite node, such as `SearchUnionNode` or `SearchIntersectNode`.

Example `!defender` would be:

```js
new SearchComplimentNode(new SearchTermNode('defender'))
```

#### `new SearchIntervalNode(term, lowerBound, upperBound)`

A node that represents a query term with a range or interval. For example, `1-3`
(Bulbasaur evolution chain), `1-2attack`, `-2hp`, etc.

#### `new SearchUniversal()`

A node representing the [Universal
set](https://en.wikipedia.org/wiki/Universe_(mathematics)), aka all Pokemon. In
practice this node should not be necessary.

#### `new SearchNull()`

A node representing the [Null set](https://en.wikipedia.org/wiki/Null_set), aka
a set which includes no Pokemon. In practice this node should not be necessary.

### Node Property & Methods

#### Properties

`type` : Represents the type of the node. All types except `INTERVAL` nodes are
derived from the
[`symbolic-sets`](https://github.com/lejeunerenard/symbolic-sets) module. Type
`INTERVAL` is exported by `pokemon-go-storage-query-tree`.

#### Methods

`.toSearchString()` : returns a Pokemon Go search string that can be used in 
game. This automatically refactors the tree into Conjunctive Normal Form.

`.toCNF()` : returns a tree refactored into the Conjunctive Normal Form.

`.simplify()` : returns an equivalent simplified tree. For example:

```js
const original = new SearchUnionNode([
  new SearchIntervalNode('attack', 0, 1),
  new SearchIntervalNode('attack', 2, 3)
])

assert.deepStrictEqual(original.simplify(), new SearchIntervalNode('attack', 0, 3)) // doesnt throw
```

`.toString(options)` : returns a tree in set theory notation. `options` are
optional.

## Acknowledgments

[@Lebeg134](https://github.com/Lebeg134) for figuring out that Pokemon Go
accepts queries in [Conjunctive Normal
Form](https://en.wikipedia.org/wiki/Conjunctive_normal_form) and [that the
distribution law of sets is key to restructuring the
tree](https://www.reddit.com/r/TheSilphRoad/comments/r8pfij/comment/hn9wf7t/?utm_source=share&utm_medium=web2x&context=3).
