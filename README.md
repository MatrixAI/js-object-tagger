# Object Tagger

Object tagger is a library that tags objects with a unique indexable number within a record. This is useful when you have a record containing objects, and these objects needs to be stored somewhere and later retrieved. Some data stores cannot index POJOs (Plain Old JavaScript Object). This library solves this by taking a record (also a POJO) and tags it mutably with keys that are uniquely related to the objects that the record originally contains. You can later also untag the objects allowing the unique ids to be reusable, or strip the tags from the objects without "untagging" the unique ids, so they are still considered to be in-use.

Currently it has an immutable object tagger that uses structure sharing. But it would be easy to create a mutable object tagger in the future (a mutable one would be more performant).

Basic Usage
-------------

```sh
npm install --save 'object-tagger';
```

```js
import { TaggerImmutable } from 'object-tagger';
const tagSchema = new Set(['key1', 'key2', 'key3', 'key4']);
const tagSuffix = 'tag'; // make sure there are no conflicts with this tag suffix!

let tagger = new TaggerImmutable(tagSchema, tagSuffix);
const obj = {};
const object = {
  key1: {},
  key3: obj,
  key4: obj,
  key2: {},
  keyRandom: {}
};
tagger = tagger.tag(object);
console.log(object);
/*
{ key1: {},
  key3: {},
  key4: {},
  key2: {},
  keyRandom: {},
  key1tag: 0,
  key2tag: 1,
  key3tag: 2,
  key4tag: 2 }
*/

// if you tag another record that uses the same `obj`
// it will be given the same tag
// but new objects (even with the same key will be given different unique tags)
const object2 = {
  key1: {},
  key3: obj,
  key4: obj,
  key2: {},
};
tagger = tagger.tag(object2);
console.log(object2);
/*
{ key1: {},
  key3: {},
  key4: {},
  key2: {},
  keyRandom: {},
  key1tag: 3,
  key2tag: 4,
  key3tag: 2,
  key4tag: 2 }
*/

// you can now strip the object without forgetting about the tags
const object_ = {...object};
tagger.strip(object);
console.log(object);
/*
{ key1: {}, key3: {}, key4: {}, key2: {}, keyRandom: {} }
*/

// you can now untag it freeing the unique ids to be reused
tagger = tagger.untag(object_);
console.log(object_);
/*
{ key1: {}, key3: {}, key4: {}, key2: {}, keyRandom: {} }
*/

// the immutable tagger has transaction context that allows you to batch up changes
tagger = tagger.transaction((tt) => {
  tt.untag(object2);
  // tt has `tag`, `untag` and `strip`
});
```

Note that tags are also counted (reference counted). If you tag the same record of objects twice, those tags have a count that is incremented. Such that if you untag once, those tags are still remembered. But if you untag twice, then the tags are truly deallocated and can be reused.

This is all implemented with Facebook's `immutable` Map, and Matrix AI's immutable `resource-counter`.

Note that only objects can be tagged. This is what this library is designed for. It will not tag non-objects.

Development
------------

To build this package for release:

```
npm run build
```

It will run tests, generate documentation and output multiple targets. One for browsers and one for nodejs. See `rollup.config.js` to see the target specification.

If your bundler is aware of the module field in `package.json`, you'll get the ES6 module directly.

Once you've updated the package run this:

```
npm version <update_type>
npm publish
```
