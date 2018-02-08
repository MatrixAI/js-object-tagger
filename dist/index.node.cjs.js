'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var resourceCounter = require('resource-counter');
var immutable = require('immutable');
var Reference = _interopDefault(require('reference-pointer'));

function _tag(tagKeys, tagSuffix, tagCounter, tagMap, changed, object) {
  tagKeys.forEach(key => {
    if (object.hasOwnProperty(key) && object[key] instanceof Object) {
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
    if (object.hasOwnProperty(key) && object[key] instanceof Object) {
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
    if (object.hasOwnProperty(key) && object[key] instanceof Object) {
      delete object[key + tagSuffix];
    }
  });
}

function _isTag(tagKeys, tagSuffix, key, value) {
  if (value === undefined || typeof value === 'number') {
    // '' + tagSuffix is also potentially a valid tag
    // if the empty string was a key
    const match = key.match(new RegExp('(.*)' + tagSuffix + '$'));
    if (match && tagKeys.has(match[1])) {
      return true;
    }
  }
  return false;
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

  isTag(key, value) {
    return _isTag(this._tagKeys, this._tagSuffix, key, value);
  }

  transaction(callback) {
    let changed = new Reference(false);
    let tagCounter, tagMap;
    tagCounter = this._tagCounter.transaction(counter => {
      tagMap = this._tagMap.withMutations(map => {
        const taggerTransaction = {
          tag: object => _tag(this._tagKeys, this._tagSuffix, counter, map, changed, object),
          untag: object => _untag(this._tagKeys, this._tagSuffix, counter, map, changed, object),
          strip: object => _strip(this._tagKeys, this._tagSuffix, object),
          isTag: (key, value) => _isTag(this._tagKeys, this._tagSuffix, key, value)
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
exports.CounterImmutable = resourceCounter.CounterImmutable;
exports.MapI = immutable.Map;
