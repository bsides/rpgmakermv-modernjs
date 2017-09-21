//=============================================================================
// rpg_core.js v1.5.1
//=============================================================================

//-----------------------------------------------------------------------------
/**
* The root object of the display tree.
*
* @class Stage
* @constructor
*/
function Stage() {
  this.initialize.apply(this, arguments)
}

Stage.prototype = Object.create(PIXI.Container.prototype)
Stage.prototype.constructor = Stage

Stage.prototype.initialize = function() {
  PIXI.Container.call(this)

  // The interactive flag causes a memory leak.
  this.interactive = false
}

/**
* [read-only] The array of children of the stage.
*
* @property children
* @type Array
*/

/**
* Adds a child to the container.
*
* @method addChild
* @param {Object} child The child to add
* @return {Object} The child that was added
*/

/**
* Adds a child to the container at a specified index.
*
* @method addChildAt
* @param {Object} child The child to add
* @param {Number} index The index to place the child in
* @return {Object} The child that was added
*/

/**
* Removes a child from the container.
*
* @method removeChild
* @param {Object} child The child to remove
* @return {Object} The child that was removed
*/

/**
* Removes a child from the specified index position.
*
* @method removeChildAt
* @param {Number} index The index to get the child from
* @return {Object} The child that was removed
*/

//-----------------------------------------------------------------------------
/**
* The audio object of Web Audio API.
*
* @class WebAudio
* @constructor
* @param {String} url The url of the audio file
*/
function WebAudio() {
  this.initialize.apply(this, arguments)
}

WebAudio._standAlone = (function(top) {
  return !top.ResourceHandler
})(this)

WebAudio.prototype.initialize = function(url) {
  if (!WebAudio._initialized) {
    WebAudio.initialize()
  }
  this.clear()

  if (!WebAudio._standAlone) {
    this._loader = ResourceHandler.createLoader(
      url,
      this._load.bind(this, url),
      function() {
        this._hasError = true
      }.bind(this)
    )
  }
  this._load(url)
  this._url = url
}

WebAudio._masterVolume = 1
WebAudio._context = null
WebAudio._masterGainNode = null
WebAudio._initialized = false
WebAudio._unlocked = false

/**
* Initializes the audio system.
*
* @static
* @method initialize
* @param {Boolean} noAudio Flag for the no-audio mode
* @return {Boolean} True if the audio system is available
*/
WebAudio.initialize = function(noAudio) {
  if (!this._initialized) {
    if (!noAudio) {
      this._createContext()
      this._detectCodecs()
      this._createMasterGainNode()
      this._setupEventHandlers()
    }
    this._initialized = true
  }
  return !!this._context
}

/**
* Checks whether the browser can play ogg files.
*
* @static
* @method canPlayOgg
* @return {Boolean} True if the browser can play ogg files
*/
WebAudio.canPlayOgg = function() {
  if (!this._initialized) {
    this.initialize()
  }
  return !!this._canPlayOgg
}

/**
* Checks whether the browser can play m4a files.
*
* @static
* @method canPlayM4a
* @return {Boolean} True if the browser can play m4a files
*/
WebAudio.canPlayM4a = function() {
  if (!this._initialized) {
    this.initialize()
  }
  return !!this._canPlayM4a
}

/**
* Sets the master volume of the all audio.
*
* @static
* @method setMasterVolume
* @param {Number} value Master volume (min: 0, max: 1)
*/
WebAudio.setMasterVolume = function(value) {
  this._masterVolume = value
  if (this._masterGainNode) {
    this._masterGainNode.gain.setValueAtTime(
      this._masterVolume,
      this._context.currentTime
    )
  }
}

/**
* @static
* @method _createContext
* @private
*/
WebAudio._createContext = function() {
  try {
    if (typeof AudioContext !== 'undefined') {
      this._context = new AudioContext()
    } else if (typeof webkitAudioContext !== 'undefined') {
      this._context = new webkitAudioContext()
    }
  } catch (e) {
    this._context = null
  }
}

/**
* @static
* @method _detectCodecs
* @private
*/
WebAudio._detectCodecs = function() {
  var audio = document.createElement('audio')
  if (audio.canPlayType) {
    this._canPlayOgg = audio.canPlayType('audio/ogg')
    this._canPlayM4a = audio.canPlayType('audio/mp4')
  }
}

/**
* @static
* @method _createMasterGainNode
* @private
*/
WebAudio._createMasterGainNode = function() {
  var context = WebAudio._context
  if (context) {
    this._masterGainNode = context.createGain()
    this._masterGainNode.gain.setValueAtTime(
      this._masterVolume,
      context.currentTime
    )
    this._masterGainNode.connect(context.destination)
  }
}

/**
* @static
* @method _setupEventHandlers
* @private
*/
WebAudio._setupEventHandlers = function() {
  document.addEventListener('touchend', function() {
    var context = WebAudio._context
    if (
      context &&
      context.state === 'suspended' &&
      typeof context.resume === 'function'
    ) {
      context.resume().then(function() {
        WebAudio._onTouchStart()
      })
    } else {
      WebAudio._onTouchStart()
    }
  })
  document.addEventListener('touchstart', this._onTouchStart.bind(this))
  document.addEventListener(
    'visibilitychange',
    this._onVisibilityChange.bind(this)
  )
}

/**
* @static
* @method _onTouchStart
* @private
*/
WebAudio._onTouchStart = function() {
  var context = WebAudio._context
  if (context && !this._unlocked) {
    // Unlock Web Audio on iOS
    var node = context.createBufferSource()
    node.start(0)
    this._unlocked = true
  }
}

/**
* @static
* @method _onVisibilityChange
* @private
*/
WebAudio._onVisibilityChange = function() {
  if (document.visibilityState === 'hidden') {
    this._onHide()
  } else {
    this._onShow()
  }
}

/**
* @static
* @method _onHide
* @private
*/
WebAudio._onHide = function() {
  if (this._shouldMuteOnHide()) {
    this._fadeOut(1)
  }
}

/**
* @static
* @method _onShow
* @private
*/
WebAudio._onShow = function() {
  if (this._shouldMuteOnHide()) {
    this._fadeIn(0.5)
  }
}

/**
* @static
* @method _shouldMuteOnHide
* @private
*/
WebAudio._shouldMuteOnHide = function() {
  return Utils.isMobileDevice()
}

/**
* @static
* @method _fadeIn
* @param {Number} duration
* @private
*/
WebAudio._fadeIn = function(duration) {
  if (this._masterGainNode) {
    var gain = this._masterGainNode.gain
    var currentTime = WebAudio._context.currentTime
    gain.setValueAtTime(0, currentTime)
    gain.linearRampToValueAtTime(this._masterVolume, currentTime + duration)
  }
}

/**
* @static
* @method _fadeOut
* @param {Number} duration
* @private
*/
WebAudio._fadeOut = function(duration) {
  if (this._masterGainNode) {
    var gain = this._masterGainNode.gain
    var currentTime = WebAudio._context.currentTime
    gain.setValueAtTime(this._masterVolume, currentTime)
    gain.linearRampToValueAtTime(0, currentTime + duration)
  }
}

/**
* Clears the audio data.
*
* @method clear
*/
WebAudio.prototype.clear = function() {
  this.stop()
  this._buffer = null
  this._sourceNode = null
  this._gainNode = null
  this._pannerNode = null
  this._totalTime = 0
  this._sampleRate = 0
  this._loopStart = 0
  this._loopLength = 0
  this._startTime = 0
  this._volume = 1
  this._pitch = 1
  this._pan = 0
  this._endTimer = null
  this._loadListeners = []
  this._stopListeners = []
  this._hasError = false
  this._autoPlay = false
}

/**
* [read-only] The url of the audio file.
*
* @property url
* @type String
*/
Object.defineProperty(WebAudio.prototype, 'url', {
  get: function() {
    return this._url
  },
  configurable: true
})

/**
* The volume of the audio.
*
* @property volume
* @type Number
*/
Object.defineProperty(WebAudio.prototype, 'volume', {
  get: function() {
    return this._volume
  },
  set: function(value) {
    this._volume = value
    if (this._gainNode) {
      this._gainNode.gain.setValueAtTime(
        this._volume,
        WebAudio._context.currentTime
      )
    }
  },
  configurable: true
})

/**
* The pitch of the audio.
*
* @property pitch
* @type Number
*/
Object.defineProperty(WebAudio.prototype, 'pitch', {
  get: function() {
    return this._pitch
  },
  set: function(value) {
    if (this._pitch !== value) {
      this._pitch = value
      if (this.isPlaying()) {
        this.play(this._sourceNode.loop, 0)
      }
    }
  },
  configurable: true
})

/**
* The pan of the audio.
*
* @property pan
* @type Number
*/
Object.defineProperty(WebAudio.prototype, 'pan', {
  get: function() {
    return this._pan
  },
  set: function(value) {
    this._pan = value
    this._updatePanner()
  },
  configurable: true
})

/**
* Checks whether the audio data is ready to play.
*
* @method isReady
* @return {Boolean} True if the audio data is ready to play
*/
WebAudio.prototype.isReady = function() {
  return !!this._buffer
}

/**
* Checks whether a loading error has occurred.
*
* @method isError
* @return {Boolean} True if a loading error has occurred
*/
WebAudio.prototype.isError = function() {
  return this._hasError
}

/**
* Checks whether the audio is playing.
*
* @method isPlaying
* @return {Boolean} True if the audio is playing
*/
WebAudio.prototype.isPlaying = function() {
  return !!this._sourceNode
}

/**
* Plays the audio.
*
* @method play
* @param {Boolean} loop Whether the audio data play in a loop
* @param {Number} offset The start position to play in seconds
*/
WebAudio.prototype.play = function(loop, offset) {
  if (this.isReady()) {
    offset = offset || 0
    this._startPlaying(loop, offset)
  } else if (WebAudio._context) {
    this._autoPlay = true
    this.addLoadListener(
      function() {
        if (this._autoPlay) {
          this.play(loop, offset)
        }
      }.bind(this)
    )
  }
}

/**
* Stops the audio.
*
* @method stop
*/
WebAudio.prototype.stop = function() {
  this._autoPlay = false
  this._removeEndTimer()
  this._removeNodes()
  if (this._stopListeners) {
    while (this._stopListeners.length > 0) {
      var listner = this._stopListeners.shift()
      listner()
    }
  }
}

/**
* Performs the audio fade-in.
*
* @method fadeIn
* @param {Number} duration Fade-in time in seconds
*/
WebAudio.prototype.fadeIn = function(duration) {
  if (this.isReady()) {
    if (this._gainNode) {
      var gain = this._gainNode.gain
      var currentTime = WebAudio._context.currentTime
      gain.setValueAtTime(0, currentTime)
      gain.linearRampToValueAtTime(this._volume, currentTime + duration)
    }
  } else if (this._autoPlay) {
    this.addLoadListener(
      function() {
        this.fadeIn(duration)
      }.bind(this)
    )
  }
}

/**
* Performs the audio fade-out.
*
* @method fadeOut
* @param {Number} duration Fade-out time in seconds
*/
WebAudio.prototype.fadeOut = function(duration) {
  if (this._gainNode) {
    var gain = this._gainNode.gain
    var currentTime = WebAudio._context.currentTime
    gain.setValueAtTime(this._volume, currentTime)
    gain.linearRampToValueAtTime(0, currentTime + duration)
  }
  this._autoPlay = false
}

/**
* Gets the seek position of the audio.
*
* @method seek
*/
WebAudio.prototype.seek = function() {
  if (WebAudio._context) {
    var pos = (WebAudio._context.currentTime - this._startTime) * this._pitch
    if (this._loopLength > 0) {
      while (pos >= this._loopStart + this._loopLength) {
        pos -= this._loopLength
      }
    }
    return pos
  } else {
    return 0
  }
}

/**
* Add a callback function that will be called when the audio data is loaded.
*
* @method addLoadListener
* @param {Function} listner The callback function
*/
WebAudio.prototype.addLoadListener = function(listner) {
  this._loadListeners.push(listner)
}

/**
* Add a callback function that will be called when the playback is stopped.
*
* @method addStopListener
* @param {Function} listner The callback function
*/
WebAudio.prototype.addStopListener = function(listner) {
  this._stopListeners.push(listner)
}

/**
* @method _load
* @param {String} url
* @private
*/
WebAudio.prototype._load = function(url) {
  if (WebAudio._context) {
    var xhr = new XMLHttpRequest()
    if (Decrypter.hasEncryptedAudio) url = Decrypter.extToEncryptExt(url)
    xhr.open('GET', url)
    xhr.responseType = 'arraybuffer'
    xhr.onload = function() {
      if (xhr.status < 400) {
        this._onXhrLoad(xhr)
      }
    }.bind(this)
    xhr.onerror =
      this._loader ||
      function() {
        this._hasError = true
      }.bind(this)
    xhr.send()
  }
}

/**
* @method _onXhrLoad
* @param {XMLHttpRequest} xhr
* @private
*/
WebAudio.prototype._onXhrLoad = function(xhr) {
  var array = xhr.response
  if (Decrypter.hasEncryptedAudio) array = Decrypter.decryptArrayBuffer(array)
  this._readLoopComments(new Uint8Array(array))
  WebAudio._context.decodeAudioData(
    array,
    function(buffer) {
      this._buffer = buffer
      this._totalTime = buffer.duration
      if (this._loopLength > 0 && this._sampleRate > 0) {
        this._loopStart /= this._sampleRate
        this._loopLength /= this._sampleRate
      } else {
        this._loopStart = 0
        this._loopLength = this._totalTime
      }
      this._onLoad()
    }.bind(this)
  )
}

/**
* @method _startPlaying
* @param {Boolean} loop
* @param {Number} offset
* @private
*/
WebAudio.prototype._startPlaying = function(loop, offset) {
  this._removeEndTimer()
  this._removeNodes()
  this._createNodes()
  this._connectNodes()
  this._sourceNode.loop = loop
  this._sourceNode.start(0, offset)
  this._startTime = WebAudio._context.currentTime - offset / this._pitch
  this._createEndTimer()
}

/**
* @method _createNodes
* @private
*/
WebAudio.prototype._createNodes = function() {
  var context = WebAudio._context
  this._sourceNode = context.createBufferSource()
  this._sourceNode.buffer = this._buffer
  this._sourceNode.loopStart = this._loopStart
  this._sourceNode.loopEnd = this._loopStart + this._loopLength
  this._sourceNode.playbackRate.setValueAtTime(this._pitch, context.currentTime)
  this._gainNode = context.createGain()
  this._gainNode.gain.setValueAtTime(this._volume, context.currentTime)
  this._pannerNode = context.createPanner()
  this._pannerNode.panningModel = 'equalpower'
  this._updatePanner()
}

/**
* @method _connectNodes
* @private
*/
WebAudio.prototype._connectNodes = function() {
  this._sourceNode.connect(this._gainNode)
  this._gainNode.connect(this._pannerNode)
  this._pannerNode.connect(WebAudio._masterGainNode)
}

/**
* @method _removeNodes
* @private
*/
WebAudio.prototype._removeNodes = function() {
  if (this._sourceNode) {
    this._sourceNode.stop(0)
    this._sourceNode = null
    this._gainNode = null
    this._pannerNode = null
  }
}

/**
* @method _createEndTimer
* @private
*/
WebAudio.prototype._createEndTimer = function() {
  if (this._sourceNode && !this._sourceNode.loop) {
    var endTime = this._startTime + this._totalTime / this._pitch
    var delay = endTime - WebAudio._context.currentTime
    this._endTimer = setTimeout(
      function() {
        this.stop()
      }.bind(this),
      delay * 1000
    )
  }
}

/**
* @method _removeEndTimer
* @private
*/
WebAudio.prototype._removeEndTimer = function() {
  if (this._endTimer) {
    clearTimeout(this._endTimer)
    this._endTimer = null
  }
}

/**
* @method _updatePanner
* @private
*/
WebAudio.prototype._updatePanner = function() {
  if (this._pannerNode) {
    var x = this._pan
    var z = 1 - Math.abs(x)
    this._pannerNode.setPosition(x, 0, z)
  }
}

/**
* @method _onLoad
* @private
*/
WebAudio.prototype._onLoad = function() {
  while (this._loadListeners.length > 0) {
    var listner = this._loadListeners.shift()
    listner()
  }
}

/**
* @method _readLoopComments
* @param {Uint8Array} array
* @private
*/
WebAudio.prototype._readLoopComments = function(array) {
  this._readOgg(array)
  this._readMp4(array)
}

/**
* @method _readOgg
* @param {Uint8Array} array
* @private
*/
WebAudio.prototype._readOgg = function(array) {
  var index = 0
  while (index < array.length) {
    if (this._readFourCharacters(array, index) === 'OggS') {
      index += 26
      var vorbisHeaderFound = false
      var numSegments = array[index++]
      var segments = []
      for (var i = 0; i < numSegments; i++) {
        segments.push(array[index++])
      }
      for (i = 0; i < numSegments; i++) {
        if (this._readFourCharacters(array, index + 1) === 'vorb') {
          var headerType = array[index]
          if (headerType === 1) {
            this._sampleRate = this._readLittleEndian(array, index + 12)
          } else if (headerType === 3) {
            this._readMetaData(array, index, segments[i])
          }
          vorbisHeaderFound = true
        }
        index += segments[i]
      }
      if (!vorbisHeaderFound) {
        break
      }
    } else {
      break
    }
  }
}

/**
* @method _readMp4
* @param {Uint8Array} array
* @private
*/
WebAudio.prototype._readMp4 = function(array) {
  if (this._readFourCharacters(array, 4) === 'ftyp') {
    var index = 0
    while (index < array.length) {
      var size = this._readBigEndian(array, index)
      var name = this._readFourCharacters(array, index + 4)
      if (name === 'moov') {
        index += 8
      } else {
        if (name === 'mvhd') {
          this._sampleRate = this._readBigEndian(array, index + 20)
        }
        if (name === 'udta' || name === 'meta') {
          this._readMetaData(array, index, size)
        }
        index += size
        if (size <= 1) {
          break
        }
      }
    }
  }
}

/**
* @method _readMetaData
* @param {Uint8Array} array
* @param {Number} index
* @param {Number} size
* @private
*/
WebAudio.prototype._readMetaData = function(array, index, size) {
  for (var i = index; i < index + size - 10; i++) {
    if (this._readFourCharacters(array, i) === 'LOOP') {
      var text = ''
      while (array[i] > 0) {
        text += String.fromCharCode(array[i++])
      }
      if (text.match(/LOOPSTART=([0-9]+)/)) {
        this._loopStart = parseInt(RegExp.$1)
      }
      if (text.match(/LOOPLENGTH=([0-9]+)/)) {
        this._loopLength = parseInt(RegExp.$1)
      }
      if (text == 'LOOPSTART' || text == 'LOOPLENGTH') {
        var text2 = ''
        i += 16
        while (array[i] > 0) {
          text2 += String.fromCharCode(array[i++])
        }
        if (text == 'LOOPSTART') {
          this._loopStart = parseInt(text2)
        } else {
          this._loopLength = parseInt(text2)
        }
      }
    }
  }
}

/**
* @method _readLittleEndian
* @param {Uint8Array} array
* @param {Number} index
* @private
*/
WebAudio.prototype._readLittleEndian = function(array, index) {
  return (
    array[index + 3] * 0x1000000 +
    array[index + 2] * 0x10000 +
    array[index + 1] * 0x100 +
    array[index + 0]
  )
}

/**
* @method _readBigEndian
* @param {Uint8Array} array
* @param {Number} index
* @private
*/
WebAudio.prototype._readBigEndian = function(array, index) {
  return (
    array[index + 0] * 0x1000000 +
    array[index + 1] * 0x10000 +
    array[index + 2] * 0x100 +
    array[index + 3]
  )
}

/**
* @method _readFourCharacters
* @param {Uint8Array} array
* @param {Number} index
* @private
*/
WebAudio.prototype._readFourCharacters = function(array, index) {
  var string = ''
  for (var i = 0; i < 4; i++) {
    string += String.fromCharCode(array[index + i])
  }
  return string
}

//-----------------------------------------------------------------------------
/**
* The static class that handles HTML5 Audio.
*
* @class Html5Audio
* @constructor
*/
function Html5Audio() {
  throw new Error('This is a static class')
}

Html5Audio._initialized = false
Html5Audio._unlocked = false
Html5Audio._audioElement = null
Html5Audio._gainTweenInterval = null
Html5Audio._tweenGain = 0
Html5Audio._tweenTargetGain = 0
Html5Audio._tweenGainStep = 0
Html5Audio._staticSePath = null

/**
* Sets up the Html5 Audio.
*
* @static
* @method setup
* @param {String} url The url of the audio file
*/
Html5Audio.setup = function(url) {
  if (!this._initialized) {
    this.initialize()
  }
  this.clear()

  if (Decrypter.hasEncryptedAudio && this._audioElement.src) {
    window.URL.revokeObjectURL(this._audioElement.src)
  }
  this._url = url
}

/**
* Initializes the audio system.
*
* @static
* @method initialize
* @return {Boolean} True if the audio system is available
*/
Html5Audio.initialize = function() {
  if (!this._initialized) {
    if (!this._audioElement) {
      try {
        this._audioElement = new Audio()
      } catch (e) {
        this._audioElement = null
      }
    }
    if (!!this._audioElement) this._setupEventHandlers()
    this._initialized = true
  }
  return !!this._audioElement
}

/**
* @static
* @method _setupEventHandlers
* @private
*/
Html5Audio._setupEventHandlers = function() {
  document.addEventListener('touchstart', this._onTouchStart.bind(this))
  document.addEventListener(
    'visibilitychange',
    this._onVisibilityChange.bind(this)
  )
  this._audioElement.addEventListener(
    'loadeddata',
    this._onLoadedData.bind(this)
  )
  this._audioElement.addEventListener('error', this._onError.bind(this))
  this._audioElement.addEventListener('ended', this._onEnded.bind(this))
}

/**
* @static
* @method _onTouchStart
* @private
*/
Html5Audio._onTouchStart = function() {
  if (this._audioElement && !this._unlocked) {
    if (this._isLoading) {
      this._load(this._url)
      this._unlocked = true
    } else {
      if (this._staticSePath) {
        this._audioElement.src = this._staticSePath
        this._audioElement.volume = 0
        this._audioElement.loop = false
        this._audioElement.play()
        this._unlocked = true
      }
    }
  }
}

/**
* @static
* @method _onVisibilityChange
* @private
*/
Html5Audio._onVisibilityChange = function() {
  if (document.visibilityState === 'hidden') {
    this._onHide()
  } else {
    this._onShow()
  }
}

/**
* @static
* @method _onLoadedData
* @private
*/
Html5Audio._onLoadedData = function() {
  this._buffered = true
  if (this._unlocked) this._onLoad()
}

/**
* @static
* @method _onError
* @private
*/
Html5Audio._onError = function() {
  this._hasError = true
}

/**
* @static
* @method _onEnded
* @private
*/
Html5Audio._onEnded = function() {
  if (!this._audioElement.loop) {
    this.stop()
  }
}

/**
* @static
* @method _onHide
* @private
*/
Html5Audio._onHide = function() {
  this._audioElement.volume = 0
  this._tweenGain = 0
}

/**
* @static
* @method _onShow
* @private
*/
Html5Audio._onShow = function() {
  this.fadeIn(0.5)
}

/**
* Clears the audio data.
*
* @static
* @method clear
*/
Html5Audio.clear = function() {
  this.stop()
  this._volume = 1
  this._loadListeners = []
  this._hasError = false
  this._autoPlay = false
  this._isLoading = false
  this._buffered = false
}

/**
* Set the URL of static se.
*
* @static
* @param {String} url
*/
Html5Audio.setStaticSe = function(url) {
  if (!this._initialized) {
    this.initialize()
    this.clear()
  }
  this._staticSePath = url
}

/**
* [read-only] The url of the audio file.
*
* @property url
* @type String
*/
Object.defineProperty(Html5Audio, 'url', {
  get: function() {
    return Html5Audio._url
  },
  configurable: true
})

/**
* The volume of the audio.
*
* @property volume
* @type Number
*/
Object.defineProperty(Html5Audio, 'volume', {
  get: function() {
    return Html5Audio._volume
  }.bind(this),
  set: function(value) {
    Html5Audio._volume = value
    if (Html5Audio._audioElement) {
      Html5Audio._audioElement.volume = this._volume
    }
  },
  configurable: true
})

/**
* Checks whether the audio data is ready to play.
*
* @static
* @method isReady
* @return {Boolean} True if the audio data is ready to play
*/
Html5Audio.isReady = function() {
  return this._buffered
}

/**
* Checks whether a loading error has occurred.
*
* @static
* @method isError
* @return {Boolean} True if a loading error has occurred
*/
Html5Audio.isError = function() {
  return this._hasError
}

/**
* Checks whether the audio is playing.
*
* @static
* @method isPlaying
* @return {Boolean} True if the audio is playing
*/
Html5Audio.isPlaying = function() {
  return !this._audioElement.paused
}

/**
* Plays the audio.
*
* @static
* @method play
* @param {Boolean} loop Whether the audio data play in a loop
* @param {Number} offset The start position to play in seconds
*/
Html5Audio.play = function(loop, offset) {
  if (this.isReady()) {
    offset = offset || 0
    this._startPlaying(loop, offset)
  } else if (Html5Audio._audioElement) {
    this._autoPlay = true
    this.addLoadListener(
      function() {
        if (this._autoPlay) {
          this.play(loop, offset)
          if (this._gainTweenInterval) {
            clearInterval(this._gainTweenInterval)
            this._gainTweenInterval = null
          }
        }
      }.bind(this)
    )
    if (!this._isLoading) this._load(this._url)
  }
}

/**
* Stops the audio.
*
* @static
* @method stop
*/
Html5Audio.stop = function() {
  if (this._audioElement) this._audioElement.pause()
  this._autoPlay = false
  if (this._tweenInterval) {
    clearInterval(this._tweenInterval)
    this._tweenInterval = null
    this._audioElement.volume = 0
  }
}

/**
* Performs the audio fade-in.
*
* @static
* @method fadeIn
* @param {Number} duration Fade-in time in seconds
*/
Html5Audio.fadeIn = function(duration) {
  if (this.isReady()) {
    if (this._audioElement) {
      this._tweenTargetGain = this._volume
      this._tweenGain = 0
      this._startGainTween(duration)
    }
  } else if (this._autoPlay) {
    this.addLoadListener(
      function() {
        this.fadeIn(duration)
      }.bind(this)
    )
  }
}

/**
* Performs the audio fade-out.
*
* @static
* @method fadeOut
* @param {Number} duration Fade-out time in seconds
*/
Html5Audio.fadeOut = function(duration) {
  if (this._audioElement) {
    this._tweenTargetGain = 0
    this._tweenGain = this._volume
    this._startGainTween(duration)
  }
}

/**
* Gets the seek position of the audio.
*
* @static
* @method seek
*/
Html5Audio.seek = function() {
  if (this._audioElement) {
    return this._audioElement.currentTime
  } else {
    return 0
  }
}

/**
* Add a callback function that will be called when the audio data is loaded.
*
* @static
* @method addLoadListener
* @param {Function} listner The callback function
*/
Html5Audio.addLoadListener = function(listner) {
  this._loadListeners.push(listner)
}

/**
* @static
* @method _load
* @param {String} url
* @private
*/
Html5Audio._load = function(url) {
  if (this._audioElement) {
    this._isLoading = true
    this._audioElement.src = url
    this._audioElement.load()
  }
}

/**
* @static
* @method _startPlaying
* @param {Boolean} loop
* @param {Number} offset
* @private
*/
Html5Audio._startPlaying = function(loop, offset) {
  this._audioElement.loop = loop
  if (this._gainTweenInterval) {
    clearInterval(this._gainTweenInterval)
    this._gainTweenInterval = null
  }
  if (this._audioElement) {
    this._audioElement.volume = this._volume
    this._audioElement.currentTime = offset
    this._audioElement.play()
  }
}

/**
* @static
* @method _onLoad
* @private
*/
Html5Audio._onLoad = function() {
  this._isLoading = false
  while (this._loadListeners.length > 0) {
    var listener = this._loadListeners.shift()
    listener()
  }
}

/**
* @static
* @method _startGainTween
* @params {Number} duration
* @private
*/
Html5Audio._startGainTween = function(duration) {
  this._audioElement.volume = this._tweenGain
  if (this._gainTweenInterval) {
    clearInterval(this._gainTweenInterval)
    this._gainTweenInterval = null
  }
  this._tweenGainStep =
    (this._tweenTargetGain - this._tweenGain) / (60 * duration)
  this._gainTweenInterval = setInterval(function() {
    Html5Audio._applyTweenValue(Html5Audio._tweenTargetGain)
  }, 1000 / 60)
}

/**
* @static
* @method _applyTweenValue
* @param {Number} volume
* @private
*/
Html5Audio._applyTweenValue = function(volume) {
  Html5Audio._tweenGain += Html5Audio._tweenGainStep
  if (Html5Audio._tweenGain < 0 && Html5Audio._tweenGainStep < 0) {
    Html5Audio._tweenGain = 0
  } else if (Html5Audio._tweenGain > volume && Html5Audio._tweenGainStep > 0) {
    Html5Audio._tweenGain = volume
  }

  if (Math.abs(Html5Audio._tweenTargetGain - Html5Audio._tweenGain) < 0.01) {
    Html5Audio._tweenGain = Html5Audio._tweenTargetGain
    clearInterval(Html5Audio._gainTweenInterval)
    Html5Audio._gainTweenInterval = null
  }

  Html5Audio._audioElement.volume = Html5Audio._tweenGain
}

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
