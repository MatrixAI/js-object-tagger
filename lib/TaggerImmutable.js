// @flow

import { CounterImmutable } from 'resource-counter';
import { Map as MapI } from 'immutable';
import Reference from 'reference-pointer';

type TaggerTransaction = {
  tag (
    Set<string>,
    string,
    CounterImmutable,
    MapI<Object, [number, number]>,
    Reference<boolean>,
    {[string]: any}
  ): void,
  untag (
    Set<string>,
    string,
    CounterImmutable,
    MapI<Object, [number, number]>,
    Reference<boolean>,
    {[string]: any}
  ): void,
  strip (
    Set<string>,
    string,
    {[string]: any}
  ): void,
};

function tag (
  tagKeys: Set<string>,
  tagSuffix: string,
  tagCounter: CounterImmutable,
  tagMap: MapI<Object, [number, number]>,
  changed: Reference<boolean>,
  object: {[string]: any}
): void {
  tagKeys.forEach((key) => {
    if (object.hasOwnProperty(key) && object[key] instanceof Object) {
      const objectTagged = object[key];
      const tagAndCount = tagMap.get(objectTagged);
      let tag;
      if (tagAndCount) {
        tag = tagAndCount[0];
        tagMap.set(objectTagged, [tag, tagAndCount[1] + 1])
      } else {
        tag = tagCounter.allocate();
        tagMap.set(objectTagged, [tag, 1]);
      }
      object[key + tagSuffix] = tag;
      changed.set(true);
    }
  });
}

function untag (
  tagKeys: Set<string>,
  tagSuffix: string,
  tagCounter: CounterImmutable,
  tagMap: MapI<Object, [number, number]>,
  changed: Reference<boolean>,
  object: {[string]: any}
): void {
  tagKeys.forEach((key) => {
    if (object.hasOwnProperty(key) && object[key] instanceof Object) {
      const objectTagged = object[key];
      const tagAndCount = tagMap.get(objectTagged);
      if (tagAndCount) {
        if ((tagAndCount[1] - 1) < 1) {
          tagCounter.deallocate(tagAndCount[0]);
          tagMap.delete(objectTagged);
        } else {
          tagMap.set(objectTagged, [tagAndCount[0], tagAndCount[1] - 1]);
        }
      }
      delete object[key + tagSuffix];
      changed.set(true);
    }
  });
}

function strip (
  tagKeys: Set<string>,
  tagSuffix: string,
  object: {[string]: any}
) {
  tagKeys.forEach((key) => {
    if (object.hasOwnProperty(key) && object[key] instanceof Object) {
      delete object[key + tagSuffix];
    }
  });
}

class TaggerImmutable {

  _tagKeys: Set<string>;
  _tagSuffix: string;
  _tagCounter: CounterImmutable;
  _tagMap: MapI<Object, [number, number]>;

  constructor (
    tagKeys: Set<string>,
    tagSuffix: string,
    tagCounter: CounterImmutable = new CounterImmutable,
    tagMap: MapI<Object, [number, number]> = MapI()
  ) {
    this._tagKeys = tagKeys;
    this._tagSuffix = tagSuffix;
    this._tagCounter = tagCounter;
    this._tagMap = tagMap;
  }

  tag (object: {[string]: any}): TaggerImmutable {
    const changed = new Reference(false);
    let tagCounter, tagMap;
    tagCounter = this._tagCounter.transaction((counter) => {
      tagMap = this._tagMap.withMutations((map) => {
        tag(this._tagKeys, this._tagSuffix, counter, map, changed, object);
      });
    });
    if (changed.get()) {
      return new TaggerImmutable(
        this._tagKeys,
        this._tagSuffix,
        tagCounter,
        tagMap
      );
    } else {
      return this;
    }
  }

  untag (object: {[string]: any}): TaggerImmutable {
    const changed = new Reference(false);
    let tagCounter, tagMap;
    tagCounter = this._tagCounter.transaction((counter) => {
      tagMap = this._tagMap.withMutations((map) => {
        untag(this._tagKeys, this._tagSuffix, counter, map, changed, object);
      });
    });
    if (changed.get()) {
      return new TaggerImmutable(
        this._tagKeys,
        this._tagSuffix,
        tagCounter,
        tagMap
      );
    } else {
      return this;
    }
  }

  strip (object: {[string]: any}): void {
    strip(this._tagKeys, this._tagSuffix, object);
  }

  transaction (callback: (TaggerTransaction) => any): TaggerImmutable {
    let changed = new Reference(false);
    let tagCounter, tagMap;
    tagCounter = this._tagCounter.transaction((counter) => {
      tagMap = this._tagMap.withMutations((map) => {
        const taggerTransaction = {
          tag: (object) => tag(
            this._tagKeys,
            this._tagSuffix,
            counter,
            map,
            changed,
            object
          ),
          untag: (object) => untag(
            this._tagKeys,
            this._tagSuffix,
            counter,
            map,
            changed,
            object
          ),
          strip: (object) => strip(
            this._tagKeys,
            this._tagSuffix,
            object
          )
        };
        callback(taggerTransaction);
      });
    });
    if (changed.get()) {
      return new TaggerImmutable(this._tagKeys, this._tagSuffix, tagCounter, tagMap);
    } else {
      return this;
    }
  }

}

export default TaggerImmutable;

export type { TaggerTransaction };
