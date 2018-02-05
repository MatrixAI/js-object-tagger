import test from 'ava';
import { CounterImmutable } from 'resource-counter';
import TaggerImmutable from '../lib/TaggerImmutable.js';

test('tagging', t => {
  let tagger = new TaggerImmutable(
    new Set(['key1', 'key2', 'key3', 'key4']),
    'tag'
  );
  // keys that are different with the same object should be tagged the same
  const obj = {};
  const object = {
    key1: {},
    key3: obj,
    key4: obj,
    key2: {},
    keyRandom: {}
  };
  tagger = tagger.tag(object);
  // key1 tag should be unique
  // key2 tag should be unique
  // key3 tag and key4 tag should be the same (but unique against all others)
  // keyRandomtag should not be tagged as it's not part of the schema
  t.true(object.key1tag !== object.key2tag);
  t.true(object.key1tag !== object.key3tag);
  t.true(object.key1tag !== object.key4tag);
  t.true(object.key2tag !== object.key3tag);
  t.true(object.key2tag !== object.key4tag);
  t.true(object.key3tag === object.key4tag);
  t.false(object.hasOwnProperty('keyRandomtag'));
});

test('untagging', t => {
  let tagger = new TaggerImmutable(
    new Set(['key1', 'key2', 'key3', 'key4']),
    'tag'
  );
  const obj = {};
  const object = {
    key1: {},
    key3: obj,
    key4: obj,
    key2: {},
    keyRandom: {}
  };
  tagger = tagger.tag(object);
  const key1tagOrig = object.key1tag;
  const key2tagOrig = object.key2tag;
  const key3tagOrig = object.key3tag;
  const key4tagOrig = object.key4tag;
  tagger = tagger.untag(object);
  t.false(object.hasOwnProperty('key1tag'));
  t.false(object.hasOwnProperty('key2tag'));
  t.false(object.hasOwnProperty('key3tag'));
  t.false(object.hasOwnProperty('key4tag'));
  tagger = tagger.tag(object);
  t.true(object.key1tag !== object.key2tag);
  t.true(object.key1tag !== object.key3tag);
  t.true(object.key1tag !== object.key4tag);
  t.true(object.key2tag !== object.key3tag);
  t.true(object.key2tag !== object.key4tag);
  t.true(object.key3tag === object.key4tag);
  // test that the unique identifiers after being untagged can be reused
  t.deepEqual(
    [key1tagOrig, key2tagOrig, key3tagOrig, key4tagOrig].sort(),
    [object.key1tag, object.key2tag, object.key3tag, object.key4tag].sort()
  );
  t.true(object.hasOwnProperty('keyRandom'));
});

test('stripping', t => {
  let tagger = new TaggerImmutable(
    new Set([
      'key1',
      'key2',
      'key3',
      'key4',
      'key5',
      'key6',
      'key7',
      'key8'
    ]),
    'tag'
  );
  const obj = {};
  const object = {
    key1: {},
    key3: obj,
    key4: obj,
    key2: {}
  };
  tagger = tagger.tag(object);
  tagger.strip(object);
  t.false(object.hasOwnProperty('key1tag'));
  t.false(object.hasOwnProperty('key2tag'));
  t.false(object.hasOwnProperty('key3tag'));
  t.false(object.hasOwnProperty('key4tag'));
  const obj2 = {};
  object.key5 = {};
  object.key6 = obj2;
  object.key7 = {};
  object.key8 = obj2;
  tagger = tagger.tag(object);
  t.true(object.key5tag !== object.key7tag);
  t.true(object.key5tag !== object.key8tag);
  t.true(object.key5tag !== object.key8tag);
  t.true(object.key7tag !== object.key6tag);
  t.true(object.key7tag !== object.key8tag);
  t.true(object.key6tag === object.key8tag);
});

test('repeat tagging on the same object should produce the same tags', t => {
  let tagger = new TaggerImmutable(
    new Set(['key1', 'key2', 'key3', 'key4']),
    'tag'
  );
  const obj = {};
  const object1 = {
    key1: {},
    key3: obj,
    key4: obj,
    key2: {}
  };
  tagger = tagger.tag(object1);
  const object2 = {
    key1: {},
    key5: obj
  };
  tagger = tagger.tag(object2);
  t.true(object2.key1tag !== object1.key1tag);
  t.true(object2.key5tag !== object1.key3tag);
  // object2.key1tag must be unique now
  t.is(
    [
      object1.key1tag,
      object1.key2tag,
      object1.key3tag,
      object1.key4tag
    ].indexOf(object2.key1tag),
    -1
  );
});

test('tagging is countable, untagging once does not remove the tags if the same objects was tagged twice', t => {
  let tagger = new TaggerImmutable(
    new Set(['key1', 'key2', 'key3', 'key4']),
    'tag'
  );
  const obj1 = {};
  const obj2 = {};
  const obj3 = {};
  const object1 = {
    key1: obj1,
    key3: obj3,
    key4: obj3,
    key2: obj2
  };
  // object2 points to the same objects as object1
  const object2 = {...object1};
  tagger = tagger.tag(object1);
  tagger = tagger.tag(object2);
  const object1KeyTags = ['key1tag', 'key2tag', 'key3tag', 'key4tag'].reduce(
    (obj, key) => {
      return {...obj, [key]: object1[key]};
    },
    {}
  );
  tagger = tagger.untag(object1);
  // even though object1 tags are untagged
  // because object2 is still tagged (and pointing to the same objects)
  // then we the tags are not truly untagged
  const object3 = {
    key1: {},
    key2: {}
  };
  tagger = tagger.tag(object3);
  // object3.key1tag and object3.key2tag cannot be a reused tag
  t.is(
    [
      object1KeyTags.key1tag,
      object1KeyTags.key2tag,
      object1KeyTags.key3tag,
      object1KeyTags.key4tag
    ].indexOf(object3.key1tag),
    -1
  );
  t.is(
    [
      object1KeyTags.key1tag,
      object1KeyTags.key2tag,
      object1KeyTags.key3tag,
      object1KeyTags.key4tag
    ].indexOf(object3.key2tag),
    -1
  );
  tagger = tagger.untag(object2);
  const object4 = {
    key1: {},
    key2: {}
  };
  tagger = tagger.tag(object4);
  // since the object1 and object2's tags are really untagged (reference count goes to 0)
  // we can expect key1tag and key2tag to be reused out of the deallocated tags
  t.true(
    [
      object1KeyTags.key1tag,
      object1KeyTags.key2tag,
      object1KeyTags.key3tag,
      object1KeyTags.key4tag
    ].indexOf(object4.key1tag) >= 0
  );
  t.true(
    [
      object1KeyTags.key1tag,
      object1KeyTags.key2tag,
      object1KeyTags.key3tag,
      object1KeyTags.key4tag
    ].indexOf(object4.key2tag) >= 0
  );
});

test('immutability of the tagger', t => {
  const tagger = new TaggerImmutable(
    new Set(['key1', 'key2', 'key3', 'key4']),
    'tag'
  );
  const obj1 = {};
  const obj2 = {};
  const obj3 = {};
  const object1 = {
    key1: obj1,
    key3: obj3,
    key4: obj3,
    key2: obj2
  };
  const obj4 = {};
  const obj5 = {};
  const obj6 = {};
  const object2 = {
    key1: obj4,
    key3: obj6,
    key4: obj6,
    key2: obj5
  };
  // tagger should do the same thing kind of tagging against 2
  // objects that have the same structure, but point to different objects
  // tagger2 and tagger3 are different, but should do the same thing
  const tagger2 = tagger.tag(object1);
  const tagger3 = tagger.tag(object2);
  // same tests for object1 and object2
  t.true(object1.key1tag !== object1.key2tag);
  t.true(object1.key1tag !== object1.key3tag);
  t.true(object1.key1tag !== object1.key4tag);
  t.true(object1.key2tag !== object1.key3tag);
  t.true(object1.key2tag !== object1.key4tag);
  t.true(object1.key3tag === object1.key4tag);
  t.true(object2.key1tag !== object2.key2tag);
  t.true(object2.key1tag !== object2.key3tag);
  t.true(object2.key1tag !== object2.key4tag);
  t.true(object2.key2tag !== object2.key3tag);
  t.true(object2.key2tag !== object2.key4tag);
  t.true(object2.key3tag === object2.key4tag);
  // check keytag equality between object1 and object2
  // they should tag the same even if they are the different objects
  const object1KeyTags = ['key1tag', 'key2tag', 'key3tag', 'key4tag'].reduce(
    (obj, key) => {
      return {...obj, [key]: object1[key]};
    },
    {}
  );
  const object2KeyTags = ['key1tag', 'key2tag', 'key3tag', 'key4tag'].reduce(
    (obj, key) => {
      return {...obj, [key]: object2[key]};
    },
    {}
  );
  t.deepEqual(
    object1KeyTags,
    object2KeyTags
  );
  // if we use tagger3 and tagger4 which was derived from the same tagger
  // on a new object that refers to the same objects
  // then they should tag exactly the same as object1Keys and object2Keys
  // because they are the same objects and tagger remembers what objects were tagged
  const object3 = {
    key1: obj1,
    key3: obj3,
    key4: obj3,
    key2: obj2
  };
  const object4 = {
    key1: obj4,
    key3: obj6,
    key4: obj6,
    key2: obj5
  };
  tagger2.tag(object3);
  tagger3.tag(object4);
  const object3KeyTags = ['key1tag', 'key2tag', 'key3tag', 'key4tag'].reduce(
    (obj, key) => {
      return {...obj, [key]: object3[key]};
    },
    {}
  );
  const object4KeyTags = ['key1tag', 'key2tag', 'key3tag', 'key4tag'].reduce(
    (obj, key) => {
      return {...obj, [key]: object4[key]};
    },
    {}
  );
});

test('transaction bundles up modifications', t => {
  let tagger = new TaggerImmutable(
    new Set(['key1', 'key2', 'key3', 'key4']),
    'tag'
  );
  const obj = {};
  const object1 = {
    key1: {},
    key3: obj,
    key4: obj,
    key2: {}
  };
  const object2 = {
    key1: {},
    key3: obj,
    key4: obj,
    key2: {}
  };
  tagger = tagger.transaction((tt) => {
    // object1 and object2 are not the same object
    // but have same structure and contents
    // but object2.key1 and object2.key2
    // are unique among all other keys in this case
    tt.tag(object1);
    tt.tag(object2);
  });
  t.true(object1.key1tag !== object1.key2tag);
  t.true(object1.key1tag !== object1.key3tag);
  t.true(object1.key1tag !== object1.key4tag);
  t.true(object1.key2tag !== object1.key3tag);
  t.true(object1.key2tag !== object1.key4tag);
  t.true(object1.key3tag === object1.key4tag);
  t.true(object2.key1tag !== object2.key2tag);
  t.true(object2.key1tag !== object2.key3tag);
  t.true(object2.key1tag !== object2.key4tag);
  t.true(object2.key2tag !== object2.key3tag);
  t.true(object2.key2tag !== object2.key4tag);
  t.true(object2.key3tag === object2.key4tag);
  // object2.key1tag is unique among object1 key tags
  t.is(
    [
      object1.key1tag,
      object1.key2tag,
      object1.key3tag,
      object1.key4tag
    ].indexOf(object2.key1tag),
    -1
  );
  // object2.key2tag is unique among object1 key tags
  t.is(
    [
      object1.key1tag,
      object1.key2tag,
      object1.key3tag,
      object1.key4tag
    ].indexOf(object2.key2tag),
    -1
  );
  t.is(object2.key3tag, object1.key3tag);
  t.is(object2.key4tag, object1.key4tag);
  const object1KeyTags = ['key1tag', 'key2tag', 'key3tag', 'key4tag'].reduce(
    (obj, key) => {
      return {...obj, [key]: object1[key]};
    },
    {}
  );
  let object1KeyTags_;
  tagger = tagger.transaction((tt) => {
    // untagging only object1, ensures that object1 tagkeys can be reused
    tt.untag(object1);
    // tagging object1 again reuses object1 tagkeys
    tt.tag(object1);
    object1KeyTags_ = ['key1tag', 'key2tag', 'key3tag', 'key4tag'].reduce(
      (obj, key) => {
        return {...obj, [key]: object1[key]};
      },
      {}
    );
    // object2 wasn't untagged
    // their unique keys shouldn't be tagged
    t.is(
      [
        object1.key1tag,
        object1.key2tag,
        object1.key3tag,
        object1.key4tag
      ].indexOf(object2.key1tag),
      -1
    );
    t.is(
      [
        object1.key1tag,
        object1.key2tag,
        object1.key3tag,
        object1.key4tag
      ].indexOf(object2.key2tag),
      -1
    );
    // because we are still using the same `obj`
    // then these should be the same
    t.is(object1.key3tag, object2.key3tag);
    t.is(object1.key4tag, object2.key4tag);
    tt.strip(object1);
  });
  t.deepEqual(object1KeyTags, object1KeyTags_);
  t.false(object1.hasOwnProperty('key1tag'));
  t.false(object1.hasOwnProperty('key2tag'));
  t.false(object1.hasOwnProperty('key3tag'));
  t.false(object1.hasOwnProperty('key4tag'));
});
