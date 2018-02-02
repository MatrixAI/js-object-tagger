import test from 'ava';
import { CounterImmutable } from 'resource-counter';
import TaggerImmutable from '../lib/TaggerImmutable.js';

test('tagging', t => {
  let tagger = new TaggerImmutable(
    new Set(['key1', 'key2', 'key3', 'key4']),
    'tag',
    new CounterImmutable(0)
  );
  const obj = {};
  const object = {
    key1: {},
    key2: {},
    key3: obj,
    key4: obj
  };
  tagger = tagger.tag(object);
  t.is(object.key1tag, 0);
  t.is(object.key2tag, 1);
  t.is(object.key3tag, 2);
  t.is(object.key4tag, 2);
});
