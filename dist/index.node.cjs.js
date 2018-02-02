'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var resourceCounter = require('resource-counter');
var immutable = require('immutable');
var Reference = _interopDefault(require('reference-pointer'));

function _tag(tagKeys, tagSuffix, tagCounter, tagMap, changed, object) {
  tagKeys.forEach(key => {
    if (object.hasOwnProperty(key)) {
      const objectTagged = object[key];
      const tagAndCount = tagMap.get(objectTagged);
      let tag;
      if (tagAndCount) {
        tag = tagAndCount[0];
        tagMap.set(objectTagged, [tag, tagAndCount[1] + 1]);
      } else {
        tag = tagCounter.allocate();
        tagMap.set(objectTagged, [tag, 1]);
      }
      object[key + tagSuffix] = tag;
      changed.set(true);
    }
  });
}

function _untag(tagKeys, tagSuffix, tagCounter, tagMap, changed, object) {
  tagKeys.forEach(key => {
    if (object.hasOwnProperty(key)) {
      const objectTagged = object[key];
      const tagAndCount = tagMap.get(objectTagged);
      if (tagAndCount) {
        if (tagAndCount[1] - 1 < 1) {
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

function _strip(tagKeys, tagSuffix, object) {
  tagKeys.forEach(key => {
    delete object[key + tagSuffix];
  });
}

class TaggerImmutable {

  constructor(tagKeys, tagSuffix, tagCounter = new resourceCounter.CounterImmutable(), tagMap = immutable.Map()) {
    this._tagKeys = tagKeys;
    this._tagSuffix = tagSuffix;
    this._tagCounter = tagCounter;
    this._tagMap = tagMap;
  }

  tag(object) {
    const changed = new Reference(false);
    let tagCounter, tagMap;
    tagCounter = this._tagCounter.transaction(counter => {
      tagMap = this._tagMap.withMutations(map => {
        _tag(this._tagKeys, this._tagSuffix, counter, map, changed, object);
      });
    });
    if (changed.get()) {
      return new TaggerImmutable(this._tagKeys, this._tagSuffix, tagCounter, tagMap);
    } else {
      return this;
    }
  }

  untag(object) {
    const changed = new Reference(false);
    let tagCounter, tagMap;
    tagCounter = this._tagCounter.transaction(counter => {
      tagMap = this._tagMap.withMutations(map => {
        _untag(this._tagKeys, this._tagSuffix, counter, map, changed, object);
      });
    });
    if (changed.get()) {
      return new TaggerImmutable(this._tagKeys, this._tagSuffix, tagCounter, tagMap);
    } else {
      return this;
    }
  }

  strip(object) {
    _strip(this._tagKeys, this._tagSuffix, object);
  }

  transaction(callback) {
    let changed = new Reference(false);
    let tagCounter, tagMap;
    tagCounter = this._tagCounter.transaction(counter => {
      tagMap = this._tagMap.withMutations(map => {
        const taggerTransaction = {
          tag: object => _tag(this._tagKeys, this._tagSuffix, counter, map, changed, object),
          untag: object => _untag(this._tagKeys, this._tagSuffix, counter, map, changed, object),
          strip: object => _strip(this._tagKeys, this._tagSuffix, object)
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

exports.TaggerImmutable = TaggerImmutable;
