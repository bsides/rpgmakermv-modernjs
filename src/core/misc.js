//-----------------------------------------------------------------------------
/**
* The static class that handles JSON with object information.
*
* @class JsonEx
*/
function JsonEx() {
  throw new Error('This is a static class')
}

/**
* The maximum depth of objects.
*
* @static
* @property maxDepth
* @type Number
* @default 100
*/
JsonEx.maxDepth = 100

JsonEx._id = 1
JsonEx._generateId = function() {
  return JsonEx._id++
}

/**
* Converts an object to a JSON string with object information.
*
* @static
* @method stringify
* @param {Object} object The object to be converted
* @return {String} The JSON string
*/
JsonEx.stringify = function(object) {
  var circular = []
  JsonEx._id = 1
  var json = JSON.stringify(this._encode(object, circular, 0))
  this._cleanMetadata(object)
  this._restoreCircularReference(circular)

  return json
}

JsonEx._restoreCircularReference = function(circulars) {
  circulars.forEach(function(circular) {
    var key = circular[0]
    var value = circular[1]
    var content = circular[2]

    value[key] = content
  })
}

/**
* Parses a JSON string and reconstructs the corresponding object.
*
* @static
* @method parse
* @param {String} json The JSON string
* @return {Object} The reconstructed object
*/
JsonEx.parse = function(json) {
  var circular = []
  var registry = {}
  var contents = this._decode(JSON.parse(json), circular, registry)
  this._cleanMetadata(contents)
  this._linkCircularReference(contents, circular, registry)

  return contents
}

JsonEx._linkCircularReference = function(contents, circulars, registry) {
  circulars.forEach(function(circular) {
    var key = circular[0]
    var value = circular[1]
    var id = circular[2]

    value[key] = registry[id]
  })
}

JsonEx._cleanMetadata = function(object) {
  if (!object) return

  delete object['@']
  delete object['@c']

  if (typeof object === 'object') {
    Object.keys(object).forEach(function(key) {
      var value = object[key]
      if (typeof value === 'object') {
        JsonEx._cleanMetadata(value)
      }
    })
  }
}

/**
* Makes a deep copy of the specified object.
*
* @static
* @method makeDeepCopy
* @param {Object} object The object to be copied
* @return {Object} The copied object
*/
JsonEx.makeDeepCopy = function(object) {
  return this.parse(this.stringify(object))
}

/**
* @static
* @method _encode
* @param {Object} value
* @param {Array} circular
* @param {Number} depth
* @return {Object}
* @private
*/
JsonEx._encode = function(value, circular, depth) {
  depth = depth || 0
  if (++depth >= this.maxDepth) {
    throw new Error('Object too deep')
  }
  var type = Object.prototype.toString.call(value)
  if (type === '[object Object]' || type === '[object Array]') {
    value['@c'] = JsonEx._generateId()

    var constructorName = this._getConstructorName(value)
    if (constructorName !== 'Object' && constructorName !== 'Array') {
      value['@'] = constructorName
    }
    for (var key in value) {
      if (value.hasOwnProperty(key) && !key.match(/^@./)) {
        if (value[key] && typeof value[key] === 'object') {
          if (value[key]['@c']) {
            circular.push([key, value, value[key]])
            value[key] = { '@r': value[key]['@c'] }
          } else {
            value[key] = this._encode(value[key], circular, depth + 1)

            if (value[key] instanceof Array) {
              //wrap array
              circular.push([key, value, value[key]])

              value[key] = {
                '@c': value[key]['@c'],
                '@a': value[key]
              }
            }
          }
        } else {
          value[key] = this._encode(value[key], circular, depth + 1)
        }
      }
    }
  }
  depth--
  return value
}

/**
* @static
* @method _decode
* @param {Object} value
* @param {Array} circular
* @param {Object} registry
* @return {Object}
* @private
*/
JsonEx._decode = function(value, circular, registry) {
  var type = Object.prototype.toString.call(value)
  if (type === '[object Object]' || type === '[object Array]') {
    registry[value['@c']] = value

    if (value['@']) {
      var constructor = window[value['@']]
      if (constructor) {
        value = this._resetPrototype(value, constructor.prototype)
      }
    }
    for (var key in value) {
      if (value.hasOwnProperty(key)) {
        if (value[key] && value[key]['@a']) {
          //object is array wrapper
          var body = value[key]['@a']
          body['@c'] = value[key]['@c']
          value[key] = body
        }
        if (value[key] && value[key]['@r']) {
          //object is reference
          circular.push([key, value, value[key]['@r']])
        }
        value[key] = this._decode(value[key], circular, registry)
      }
    }
  }
  return value
}

/**
* @static
* @method _getConstructorName
* @param {Object} value
* @return {String}
* @private
*/
JsonEx._getConstructorName = function(value) {
  var name = value.constructor.name
  if (name === undefined) {
    var func = /^\s*function\s*([A-Za-z0-9_$]*)/
    name = func.exec(value.constructor)[1]
  }
  return name
}

/**
* @static
* @method _resetPrototype
* @param {Object} value
* @param {Object} prototype
* @return {Object}
* @private
*/
JsonEx._resetPrototype = function(value, prototype) {
  if (Object.setPrototypeOf !== undefined) {
    Object.setPrototypeOf(value, prototype)
  } else if ('__proto__' in value) {
    value.__proto__ = prototype
  } else {
    var newValue = Object.create(prototype)
    for (var key in value) {
      if (value.hasOwnProperty(key)) {
        newValue[key] = value[key]
      }
    }
    value = newValue
  }
  return value
}

function Decrypter() {
  throw new Error('This is a static class')
}

Decrypter.hasEncryptedImages = false
Decrypter.hasEncryptedAudio = false
Decrypter._requestImgFile = []
Decrypter._headerlength = 16
Decrypter._xhrOk = 400
Decrypter._encryptionKey = ''
Decrypter._ignoreList = ['img/system/Window.png']
Decrypter.SIGNATURE = '5250474d56000000'
Decrypter.VER = '000301'
Decrypter.REMAIN = '0000000000'

Decrypter.checkImgIgnore = function(url) {
  for (var cnt = 0; cnt < this._ignoreList.length; cnt++) {
    if (url === this._ignoreList[cnt]) return true
  }
  return false
}

Decrypter.decryptImg = function(url, bitmap) {
  url = this.extToEncryptExt(url)

  var requestFile = new XMLHttpRequest()
  requestFile.open('GET', url)
  requestFile.responseType = 'arraybuffer'
  requestFile.send()

  requestFile.onload = function() {
    if (this.status < Decrypter._xhrOk) {
      var arrayBuffer = Decrypter.decryptArrayBuffer(requestFile.response)
      bitmap._image.src = Decrypter.createBlobUrl(arrayBuffer)
      bitmap._image.addEventListener(
        'load',
        (bitmap._loadListener = Bitmap.prototype._onLoad.bind(bitmap))
      )
      bitmap._image.addEventListener(
        'error',
        (bitmap._errorListener =
          bitmap._loader || Bitmap.prototype._onError.bind(bitmap))
      )
    }
  }

  requestFile.onerror = function() {
    if (bitmap._loader) {
      bitmap._loader()
    } else {
      bitmap._onError()
    }
  }
}

Decrypter.decryptHTML5Audio = function(url, bgm, pos) {
  var requestFile = new XMLHttpRequest()
  requestFile.open('GET', url)
  requestFile.responseType = 'arraybuffer'
  requestFile.send()

  requestFile.onload = function() {
    if (this.status < Decrypter._xhrOk) {
      var arrayBuffer = Decrypter.decryptArrayBuffer(requestFile.response)
      var url = Decrypter.createBlobUrl(arrayBuffer)
      AudioManager.createDecryptBuffer(url, bgm, pos)
    }
  }
}

Decrypter.cutArrayHeader = function(arrayBuffer, length) {
  return arrayBuffer.slice(length)
}

Decrypter.decryptArrayBuffer = function(arrayBuffer) {
  if (!arrayBuffer) return null
  var header = new Uint8Array(arrayBuffer, 0, this._headerlength)

  var i
  var ref = this.SIGNATURE + this.VER + this.REMAIN
  var refBytes = new Uint8Array(16)
  for (i = 0; i < this._headerlength; i++) {
    refBytes[i] = parseInt('0x' + ref.substr(i * 2, 2), 16)
  }
  for (i = 0; i < this._headerlength; i++) {
    if (header[i] !== refBytes[i]) {
      throw new Error('Header is wrong')
    }
  }

  arrayBuffer = this.cutArrayHeader(arrayBuffer, Decrypter._headerlength)
  var view = new DataView(arrayBuffer)
  this.readEncryptionkey()
  if (arrayBuffer) {
    var byteArray = new Uint8Array(arrayBuffer)
    for (i = 0; i < this._headerlength; i++) {
      byteArray[i] = byteArray[i] ^ parseInt(Decrypter._encryptionKey[i], 16)
      view.setUint8(i, byteArray[i])
    }
  }

  return arrayBuffer
}

Decrypter.createBlobUrl = function(arrayBuffer) {
  var blob = new Blob([arrayBuffer])
  return window.URL.createObjectURL(blob)
}

Decrypter.extToEncryptExt = function(url) {
  var ext = url.split('.').pop()
  var encryptedExt = ext

  if (ext === 'ogg') encryptedExt = '.rpgmvo'
  else if (ext === 'm4a') encryptedExt = '.rpgmvm'
  else if (ext === 'png') encryptedExt = '.rpgmvp'
  else encryptedExt = ext

  return url.slice(0, url.lastIndexOf(ext) - 1) + encryptedExt
}

Decrypter.readEncryptionkey = function() {
  this._encryptionKey = $dataSystem.encryptionKey
    .split(/(.{2})/)
    .filter(Boolean)
}

//-----------------------------------------------------------------------------
/**
* The static class that handles resource loading.
*
* @class ResourceHandler
*/
function ResourceHandler() {
  throw new Error('This is a static class')
}

ResourceHandler._reloaders = []
ResourceHandler._defaultRetryInterval = [500, 1000, 3000]

ResourceHandler.createLoader = function(
  url,
  retryMethod,
  resignMethod,
  retryInterval
) {
  retryInterval = retryInterval || this._defaultRetryInterval
  var reloaders = this._reloaders
  var retryCount = 0
  return function() {
    if (retryCount < retryInterval.length) {
      setTimeout(retryMethod, retryInterval[retryCount])
      retryCount++
    } else {
      if (resignMethod) {
        resignMethod()
      }
      if (url) {
        if (reloaders.length === 0) {
          Graphics.printLoadingError(url)
          SceneManager.stop()
        }
        reloaders.push(function() {
          retryCount = 0
          retryMethod()
        })
      }
    }
  }
}

ResourceHandler.exists = function() {
  return this._reloaders.length > 0
}

ResourceHandler.retry = function() {
  if (this._reloaders.length > 0) {
    Graphics.eraseLoadingError()
    SceneManager.resume()
    this._reloaders.forEach(function(reloader) {
      reloader()
    })
    this._reloaders.length = 0
  }
}

export { JsonEx, Decrypter, ResourceHandler }
