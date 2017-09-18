//-----------------------------------------------------------------------------
/**
 * The resource class. Allows to be collected as a garbage if not use for some time or ticks
 *
 * @class CacheEntry
 * @constructor
 * @param {ResourceManager} resource manager
 * @param {string} key, url of the resource
 * @param {string} item - Bitmap, HTML5Audio, WebAudio - whatever you want to store in the cache
 */

class CacheEntry {
  constructor(cache, key, item) {
    this.cache = cache
    this.key = key
    this.item = item
    this.cached = false
    this.touchTicks = 0
    this.touchSeconds = 0
    this.ttlTicks = 0
    this.ttlSeconds = 0
    this.freedByTTL = false
  }

  /**
  * frees the resource
  */
  free = byTTL => {
    this.freedByTTL = byTTL || false
    if (this.cached) {
      this.cached = false
      delete this.cache._inner[this.key]
    }
  }

  /**
  * Allocates the resource
  * @returns {CacheEntry}
  */
  allocate = () => {
    if (!this.cached) {
      this.cache._inner[this.key] = this
      this.cached = true
    }
    this.touch()
    return this
  }

  /**
  * Sets the time to live
  * @param {number} ticks TTL in ticks, 0 if not set
  * @param {number} time TTL in seconds, 0 if not set
  * @returns {CacheEntry}
  */
  setTimeToLive = (ticks, seconds) => {
    this.ttlTicks = ticks || 0
    this.ttlSeconds = seconds || 0
    return this
  }
  isStillAlive = () => {
    const cache = this.cache
    return (
      (this.ttlTicks == 0 ||
        this.touchTicks + this.ttlTicks < cache.updateTicks) &&
      (this.ttlSeconds == 0 ||
        this.touchSeconds + this.ttlSeconds < cache.updateSeconds)
    )
  }

  /**
  * makes sure that resource wont freed by Time To Live
  * if resource was already freed by TTL, put it in cache again
  */
  touch = () => {
    const cache = this.cache
    if (this.cached) {
      this.touchTicks = cache.updateTicks
      this.touchSeconds = cache.updateSeconds
    } else if (this.freedByTTL) {
      this.freedByTTL = false
      if (!cache._inner[this.key]) {
        cache._inner[this.key] = this
      }
    }
  }
}

/**
* Cache for images, audio, or any other kind of resource
* @param manager
* @constructor
*/
class CacheMap {
  constructor(manager) {
    this.manager = manager
    this._inner = {}
    this._lastRemovedEntries = {}
    this.updateTicks = 0
    this.lastCheckTTL = 0
    this.delayCheckTTL = 100.0
    this.updateSeconds = Date.now()
  }

  /**
  * checks ttl of all elements and removes dead ones
  */
  checkTTL = () => {
    const cache = this._inner
    let temp = this._lastRemovedEntries
    if (!temp) {
      temp = []
      this._lastRemovedEntries = temp
    }
    for (var key in cache) {
      var entry = cache[key]
      if (!entry.isStillAlive()) {
        temp.push(entry)
      }
    }
    for (var i = 0; i < temp.length; i++) {
      temp[i].free(true)
    }
    temp.length = 0
  }

  /**
  * cache item
  * @param key url of cache element
  * @returns {*|null}
  */
  getItem = key => {
    const entry = this._inner[key]
    if (entry) {
      return entry.item
    }
    return null
  }

  clear = () => {
    const keys = Object.keys(this._inner)
    for (let i = 0; i < keys.length; i++) {
      this._inner[keys[i]].free()
    }
  }

  setItem = (key, item) => {
    return new CacheEntry(this, key, item).allocate()
  }

  update = (ticks, delta) => {
    this.updateTicks += ticks
    this.updateSeconds += delta
    if (this.updateSeconds >= this.delayCheckTTL + this.lastCheckTTL) {
      this.lastCheckTTL = this.updateSeconds
      this.checkTTL()
    }
  }
}

class ImageCache {
  limit = 10 * 1000 * 1000

  constructor() {
    this.initialize.apply(this, arguments)
  }
  initialize = () => {
    this._items = {}
  }
  add = (key, value) => {
    this._items[key] = {
      bitmap: value,
      touch: Date.now(),
      key: key
    }

    this._truncateCache()
  }
  reserve = (key, value, reservationId) => {
    if (!this._items[key]) {
      this._items[key] = {
        bitmap: value,
        touch: Date.now(),
        key: key
      }
    }

    this._items[key].reservationId = reservationId
  }
  releaseReservation = reservationId => {
    const items = this._items

    Object.keys(items)
      .map(function(key) {
        return items[key]
      })
      .forEach(function(item) {
        if (item.reservationId === reservationId) {
          delete item.reservationId
        }
      })
  }
  _truncateCache = () => {
    var items = this._items
    var sizeLeft = ImageCache.limit

    Object.keys(items)
      .map(function(key) {
        return items[key]
      })
      .sort(function(a, b) {
        return b.touch - a.touch
      })
      .forEach(
        function(item) {
          if (sizeLeft > 0 || this._mustBeHeld(item)) {
            var bitmap = item.bitmap
            sizeLeft -= bitmap.width * bitmap.height
          } else {
            delete items[item.key]
          }
        }.bind(this)
      )
  }
  _mustBeHeld(item) {
    // request only is weak so It's purgeable
    if (item.bitmap.isRequestOnly()) return false
    // reserved item must be held
    if (item.reservationId) return true
    // not ready bitmap must be held (because of checking isReady())
    if (!item.bitmap.isReady()) return true
    // then the item may purgeable
    return false
  }
  isReady = () => {
    const items = this._items
    return !Object.keys(items).some(function(key) {
      return !items[key].bitmap.isRequestOnly() && !items[key].bitmap.isReady()
    })
  }
  getErrorBitmap = () => {
    const items = this._items
    let bitmap = null
    if (
      Object.keys(items).some(function(key) {
        if (items[key].bitmap.isError()) {
          bitmap = items[key].bitmap
          return true
        }
        return false
      })
    ) {
      return bitmap
    }

    return null
  }
}
// "get" is reserved for getters so we shouldn't thouch this right now
ImageCache.prototype.get = function(key) {
  if (this._items[key]) {
    const item = this._items[key]
    item.touch = Date.now()
    return item.bitmap
  }

  return null
}

class RequestQueue {
  constructor() {
    this.initialize.apply(this, arguments)
  }
  initialize = () => {
    this._queue = []
  }
  enqueue = (key, value) => {
    this._queue.push({
      key: key,
      value: value
    })
  }
  update = () => {
    if (this._queue.length === 0) return

    const top = this._queue[0]
    if (top.value.isRequestReady()) {
      this._queue.shift()
      if (this._queue.length !== 0) {
        this._queue[0].value.startRequest()
      }
    } else {
      top.value.startRequest()
    }
  }
  raisePriority = key => {
    for (let n = 0; n < this._queue.length; n++) {
      const item = this._queue[n]
      if (item.key === key) {
        this._queue.splice(n, 1)
        this._queue.unshift(item)
        break
      }
    }
  }
  clear = () => {
    this._queue.splice(0)
  }
}

export { CacheEntry, CacheMap, ImageCache, RequestQueue }
