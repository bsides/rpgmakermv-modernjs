//-----------------------------------------------------------------------------
/**
* The tilemap which displays 2D tile-based game map.
*
* @class Tilemap
* @constructor
*/
class Tilemap extends PIXI.Container {
  constructor() {
    super()
    this.initialize.apply(this, arguments)
  }
  initialize() {
    // I'm commenting just in case something breaks up
    // PIXI.Container.call(this)

    this._margin = 20
    this._width = Graphics.width + this._margin * 2
    this._height = Graphics.height + this._margin * 2
    this._tileWidth = 48
    this._tileHeight = 48
    this._mapWidth = 0
    this._mapHeight = 0
    this._mapData = null
    this._layerWidth = 0
    this._layerHeight = 0
    this._lastTiles = []

    /**
     * The bitmaps used as a tileset.
     *
     * @property bitmaps
     * @type Array
     */
    this.bitmaps = []

    /**
     * The origin point of the tilemap for scrolling.
     *
     * @property origin
     * @type Point
     */
    this.origin = new Point()

    /**
     * The tileset flags.
     *
     * @property flags
     * @type Array
     */
    this.flags = []

    /**
     * The animation count for autotiles.
     *
     * @property animationCount
     * @type Number
     */
    this.animationCount = 0

    /**
     * Whether the tilemap loops horizontal.
     *
     * @property horizontalWrap
     * @type Boolean
     */
    this.horizontalWrap = false

    /**
     * Whether the tilemap loops vertical.
     *
     * @property verticalWrap
     * @type Boolean
     */
    this.verticalWrap = false

    this._createLayers()
    this.refresh()
  }

  /**
  * The width of the screen in pixels.
  *
  * @property width
  * @type Number
  */
  get width() {
    return this._width
  }
  set width(value) {
    if (this._width !== value) {
      this._width = value
      this._createLayers()
    }
  }

  /**
  * The height of the screen in pixels.
  *
  * @property height
  * @type Number
  */
  get height() {
    return this._height
  }
  set height(value) {
    if (this._height !== value) {
      this._height = value
      this._createLayers()
    }
  }

  /**
  * The width of a tile in pixels.
  *
  * @property tileWidth
  * @type Number
  */
  get tileWidth() {
    return this._tileWidth
  }
  set tileWidth(value) {
    if (this._tileWidth !== value) {
      this._tileWidth = value
      this._createLayers()
    }
  }

  /**
  * The height of a tile in pixels.
  *
  * @property tileHeight
  * @type Number
  */
  get tileHeight() {
    return this._tileHeight
  }
  set tileHeight(value) {
    if (this._tileHeight !== value) {
      this._tileHeight = value
      this._createLayers()
    }
  }

  /**
  * Sets the tilemap data.
  *
  * @method setData
  * @param {Number} width The width of the map in number of tiles
  * @param {Number} height The height of the map in number of tiles
  * @param {Array} data The one dimensional array for the map data
  */
  setData(width, height, data) {
    this._mapWidth = width
    this._mapHeight = height
    this._mapData = data
  }

  /**
  * Checks whether the tileset is ready to render.
  *
  * @method isReady
  * @type Boolean
  * @return {Boolean} True if the tilemap is ready
  */
  isReady() {
    for (let i = 0; i < this.bitmaps.length; i++) {
      if (this.bitmaps[i] && !this.bitmaps[i].isReady()) {
        return false
      }
    }
    return true
  }

  /**
  * Updates the tilemap for each frame.
  *
  * @method update
  */
  update() {
    this.animationCount++
    this.animationFrame = Math.floor(this.animationCount / 30)
    this.children.forEach(function(child) {
      if (child.update) {
        child.update()
      }
    })
    for (let i = 0; i < this.bitmaps.length; i++) {
      if (this.bitmaps[i]) {
        this.bitmaps[i].touch()
      }
    }
  }

  /**
  * Forces to repaint the entire tilemap.
  *
  * @method refresh
  */
  refresh() {
    this._lastTiles.length = 0
  }

  /**
  * Forces to refresh the tileset
  *
  * @method refresh
  */
  refreshTileset() {}

  /**
  * @method updateTransform
  * @private
  */
  updateTransform() {
    const ox = Math.floor(this.origin.x)
    const oy = Math.floor(this.origin.y)
    const startX = Math.floor((ox - this._margin) / this._tileWidth)
    const startY = Math.floor((oy - this._margin) / this._tileHeight)
    this._updateLayerPositions(startX, startY)
    if (
      this._needsRepaint ||
      this._lastAnimationFrame !== this.animationFrame ||
      this._lastStartX !== startX ||
      this._lastStartY !== startY
    ) {
      this._frameUpdated = this._lastAnimationFrame !== this.animationFrame
      this._lastAnimationFrame = this.animationFrame
      this._lastStartX = startX
      this._lastStartY = startY
      this._paintAllTiles(startX, startY)
      this._needsRepaint = false
    }
    this._sortChildren()
    super.updateTransform.call(this)
  }

  /**
  * @method _createLayers
  * @private
  */
  _createLayers() {
    const width = this._width
    const height = this._height
    const margin = this._margin
    const tileCols = Math.ceil(width / this._tileWidth) + 1
    const tileRows = Math.ceil(height / this._tileHeight) + 1
    const layerWidth = tileCols * this._tileWidth
    const layerHeight = tileRows * this._tileHeight
    this._lowerBitmap = new Bitmap(layerWidth, layerHeight)
    this._upperBitmap = new Bitmap(layerWidth, layerHeight)
    this._layerWidth = layerWidth
    this._layerHeight = layerHeight

    /*
     * Z coordinate:
     *
     * 0 : Lower tiles
     * 1 : Lower characters
     * 3 : Normal characters
     * 4 : Upper tiles
     * 5 : Upper characters
     * 6 : Airship shadow
     * 7 : Balloon
     * 8 : Animation
     * 9 : Destination
     */

    this._lowerLayer = new Sprite()
    this._lowerLayer.move(-margin, -margin, width, height)
    this._lowerLayer.z = 0

    this._upperLayer = new Sprite()
    this._upperLayer.move(-margin, -margin, width, height)
    this._upperLayer.z = 4

    for (let i = 0; i < 4; i++) {
      this._lowerLayer.addChild(new Sprite(this._lowerBitmap))
      this._upperLayer.addChild(new Sprite(this._upperBitmap))
    }

    this.addChild(this._lowerLayer)
    this.addChild(this._upperLayer)
  }

  /**
  * @method _updateLayerPositions
  * @param {Number} startX
  * @param {Number} startY
  * @private
  */
  _updateLayerPositions(startX, startY) {
    const m = this._margin
    const ox = Math.floor(this.origin.x)
    const oy = Math.floor(this.origin.y)
    const x2 = (ox - m).mod(this._layerWidth)
    const y2 = (oy - m).mod(this._layerHeight)
    const w1 = this._layerWidth - x2
    const h1 = this._layerHeight - y2
    const w2 = this._width - w1
    const h2 = this._height - h1

    for (let i = 0; i < 2; i++) {
      let children
      if (i === 0) {
        children = this._lowerLayer.children
      } else {
        children = this._upperLayer.children
      }
      children[0].move(0, 0, w1, h1)
      children[0].setFrame(x2, y2, w1, h1)
      children[1].move(w1, 0, w2, h1)
      children[1].setFrame(0, y2, w2, h1)
      children[2].move(0, h1, w1, h2)
      children[2].setFrame(x2, 0, w1, h2)
      children[3].move(w1, h1, w2, h2)
      children[3].setFrame(0, 0, w2, h2)
    }
  }

  /**
  * @method _paintAllTiles
  * @param {Number} startX
  * @param {Number} startY
  * @private
  */
  _paintAllTiles(startX, startY) {
    const tileCols = Math.ceil(this._width / this._tileWidth) + 1
    const tileRows = Math.ceil(this._height / this._tileHeight) + 1
    for (let y = 0; y < tileRows; y++) {
      for (let x = 0; x < tileCols; x++) {
        this._paintTiles(startX, startY, x, y)
      }
    }
  }

  /**
  * @method _paintTiles
  * @param {Number} startX
  * @param {Number} startY
  * @param {Number} x
  * @param {Number} y
  * @private
  */
  _paintTiles(startX, startY, x, y) {
    const tableEdgeVirtualId = 10000
    const mx = startX + x
    const my = startY + y
    const dx = (mx * this._tileWidth).mod(this._layerWidth)
    const dy = (my * this._tileHeight).mod(this._layerHeight)
    const lx = dx / this._tileWidth
    const ly = dy / this._tileHeight
    const tileId0 = this._readMapData(mx, my, 0)
    const tileId1 = this._readMapData(mx, my, 1)
    const tileId2 = this._readMapData(mx, my, 2)
    const tileId3 = this._readMapData(mx, my, 3)
    const shadowBits = this._readMapData(mx, my, 4)
    const upperTileId1 = this._readMapData(mx, my - 1, 1)
    const lowerTiles = []
    const upperTiles = []

    if (this._isHigherTile(tileId0)) {
      upperTiles.push(tileId0)
    } else {
      lowerTiles.push(tileId0)
    }
    if (this._isHigherTile(tileId1)) {
      upperTiles.push(tileId1)
    } else {
      lowerTiles.push(tileId1)
    }

    lowerTiles.push(-shadowBits)

    if (this._isTableTile(upperTileId1) && !this._isTableTile(tileId1)) {
      if (!Tilemap.isShadowingTile(tileId0)) {
        lowerTiles.push(tableEdgeVirtualId + upperTileId1)
      }
    }

    if (this._isOverpassPosition(mx, my)) {
      upperTiles.push(tileId2)
      upperTiles.push(tileId3)
    } else {
      if (this._isHigherTile(tileId2)) {
        upperTiles.push(tileId2)
      } else {
        lowerTiles.push(tileId2)
      }
      if (this._isHigherTile(tileId3)) {
        upperTiles.push(tileId3)
      } else {
        lowerTiles.push(tileId3)
      }
    }

    const lastLowerTiles = this._readLastTiles(0, lx, ly)
    if (
      !lowerTiles.equals(lastLowerTiles) ||
      (Tilemap.isTileA1(tileId0) && this._frameUpdated)
    ) {
      this._lowerBitmap.clearRect(dx, dy, this._tileWidth, this._tileHeight)
      for (let i = 0; i < lowerTiles.length; i++) {
        const lowerTileId = lowerTiles[i]
        if (lowerTileId < 0) {
          this._drawShadow(this._lowerBitmap, shadowBits, dx, dy)
        } else if (lowerTileId >= tableEdgeVirtualId) {
          this._drawTableEdge(this._lowerBitmap, upperTileId1, dx, dy)
        } else {
          this._drawTile(this._lowerBitmap, lowerTileId, dx, dy)
        }
      }
      this._writeLastTiles(0, lx, ly, lowerTiles)
    }

    const lastUpperTiles = this._readLastTiles(1, lx, ly)
    if (!upperTiles.equals(lastUpperTiles)) {
      this._upperBitmap.clearRect(dx, dy, this._tileWidth, this._tileHeight)
      for (let j = 0; j < upperTiles.length; j++) {
        this._drawTile(this._upperBitmap, upperTiles[j], dx, dy)
      }
      this._writeLastTiles(1, lx, ly, upperTiles)
    }
  }

  /**
  * @method _readLastTiles
  * @param {Number} i
  * @param {Number} x
  * @param {Number} y
  * @private
  */
  _readLastTiles(i, x, y) {
    const array1 = this._lastTiles[i]
    if (array1) {
      const array2 = array1[y]
      if (array2) {
        const tiles = array2[x]
        if (tiles) {
          return tiles
        }
      }
    }
    return []
  }

  /**
  * @method _writeLastTiles
  * @param {Number} i
  * @param {Number} x
  * @param {Number} y
  * @param {Array} tiles
  * @private
  */
  _writeLastTiles(i, x, y, tiles) {
    const array1 = this._lastTiles[i]
    if (!array1) {
      array1 = this._lastTiles[i] = []
    }
    const array2 = array1[y]
    if (!array2) {
      array2 = array1[y] = []
    }
    array2[x] = tiles
  }

  /**
  * @method _drawTile
  * @param {Bitmap} bitmap
  * @param {Number} tileId
  * @param {Number} dx
  * @param {Number} dy
  * @private
  */
  _drawTile(bitmap, tileId, dx, dy) {
    if (Tilemap.isVisibleTile(tileId)) {
      if (Tilemap.isAutotile(tileId)) {
        this._drawAutotile(bitmap, tileId, dx, dy)
      } else {
        this._drawNormalTile(bitmap, tileId, dx, dy)
      }
    }
  }

  /**
  * @method _drawNormalTile
  * @param {Bitmap} bitmap
  * @param {Number} tileId
  * @param {Number} dx
  * @param {Number} dy
  * @private
  */
  _drawNormalTile(bitmap, tileId, dx, dy) {
    let setNumber = 0

    if (Tilemap.isTileA5(tileId)) {
      setNumber = 4
    } else {
      setNumber = 5 + Math.floor(tileId / 256)
    }

    const w = this._tileWidth
    const h = this._tileHeight
    const sx = ((Math.floor(tileId / 128) % 2) * 8 + tileId % 8) * w
    const sy = (Math.floor((tileId % 256) / 8) % 16) * h

    const source = this.bitmaps[setNumber]
    if (source) {
      bitmap.bltImage(source, sx, sy, w, h, dx, dy, w, h)
    }
  }

  /**
  * @method _drawAutotile
  * @param {Bitmap} bitmap
  * @param {Number} tileId
  * @param {Number} dx
  * @param {Number} dy
  * @private
  */
  _drawAutotile(bitmap, tileId, dx, dy) {
    let autotileTable = Tilemap.FLOOR_AUTOTILE_TABLE
    const kind = Tilemap.getAutotileKind(tileId)
    const shape = Tilemap.getAutotileShape(tileId)
    const tx = kind % 8
    const ty = Math.floor(kind / 8)
    let bx = 0
    let by = 0
    let setNumber = 0
    let isTable = false

    if (Tilemap.isTileA1(tileId)) {
      const waterSurfaceIndex = [0, 1, 2, 1][this.animationFrame % 4]
      setNumber = 0
      if (kind === 0) {
        bx = waterSurfaceIndex * 2
        by = 0
      } else if (kind === 1) {
        bx = waterSurfaceIndex * 2
        by = 3
      } else if (kind === 2) {
        bx = 6
        by = 0
      } else if (kind === 3) {
        bx = 6
        by = 3
      } else {
        bx = Math.floor(tx / 4) * 8
        by = ty * 6 + (Math.floor(tx / 2) % 2) * 3
        if (kind % 2 === 0) {
          bx += waterSurfaceIndex * 2
        } else {
          bx += 6
          autotileTable = Tilemap.WATERFALL_AUTOTILE_TABLE
          by += this.animationFrame % 3
        }
      }
    } else if (Tilemap.isTileA2(tileId)) {
      setNumber = 1
      bx = tx * 2
      by = (ty - 2) * 3
      isTable = this._isTableTile(tileId)
    } else if (Tilemap.isTileA3(tileId)) {
      setNumber = 2
      bx = tx * 2
      by = (ty - 6) * 2
      autotileTable = Tilemap.WALL_AUTOTILE_TABLE
    } else if (Tilemap.isTileA4(tileId)) {
      setNumber = 3
      bx = tx * 2
      by = Math.floor((ty - 10) * 2.5 + (ty % 2 === 1 ? 0.5 : 0))
      if (ty % 2 === 1) {
        autotileTable = Tilemap.WALL_AUTOTILE_TABLE
      }
    }

    const table = autotileTable[shape]
    const source = this.bitmaps[setNumber]

    if (table && source) {
      const w1 = this._tileWidth / 2
      const h1 = this._tileHeight / 2
      for (let i = 0; i < 4; i++) {
        const qsx = table[i][0]
        const qsy = table[i][1]
        const sx1 = (bx * 2 + qsx) * w1
        const sy1 = (by * 2 + qsy) * h1
        const dx1 = dx + (i % 2) * w1
        let dy1 = dy + Math.floor(i / 2) * h1
        if (isTable && (qsy === 1 || qsy === 5)) {
          let qsx2 = qsx
          const qsy2 = 3
          if (qsy === 1) {
            qsx2 = [0, 3, 2, 1][qsx]
          }
          var sx2 = (bx * 2 + qsx2) * w1
          var sy2 = (by * 2 + qsy2) * h1
          bitmap.bltImage(source, sx2, sy2, w1, h1, dx1, dy1, w1, h1)
          dy1 += h1 / 2
          bitmap.bltImage(source, sx1, sy1, w1, h1 / 2, dx1, dy1, w1, h1 / 2)
        } else {
          bitmap.bltImage(source, sx1, sy1, w1, h1, dx1, dy1, w1, h1)
        }
      }
    }
  }

  /**
  * @method _drawTableEdge
  * @param {Bitmap} bitmap
  * @param {Number} tileId
  * @param {Number} dx
  * @param {Number} dy
  * @private
  */
  _drawTableEdge(bitmap, tileId, dx, dy) {
    if (Tilemap.isTileA2(tileId)) {
      const autotileTable = Tilemap.FLOOR_AUTOTILE_TABLE
      const kind = Tilemap.getAutotileKind(tileId)
      const shape = Tilemap.getAutotileShape(tileId)
      const tx = kind % 8
      const ty = Math.floor(kind / 8)
      const setNumber = 1
      const bx = tx * 2
      const by = (ty - 2) * 3
      const table = autotileTable[shape]

      if (table) {
        const source = this.bitmaps[setNumber]
        const w1 = this._tileWidth / 2
        const h1 = this._tileHeight / 2
        for (let i = 0; i < 2; i++) {
          const qsx = table[2 + i][0]
          const qsy = table[2 + i][1]
          const sx1 = (bx * 2 + qsx) * w1
          const sy1 = (by * 2 + qsy) * h1 + h1 / 2
          const dx1 = dx + (i % 2) * w1
          const dy1 = dy + Math.floor(i / 2) * h1
          bitmap.bltImage(source, sx1, sy1, w1, h1 / 2, dx1, dy1, w1, h1 / 2)
        }
      }
    }
  }

  /**
  * @method _drawShadow
  * @param {Bitmap} bitmap
  * @param {Number} shadowBits
  * @param {Number} dx
  * @param {Number} dy
  * @private
  */
  _drawShadow(bitmap, shadowBits, dx, dy) {
    if (shadowBits & 0x0f) {
      const w1 = this._tileWidth / 2
      const h1 = this._tileHeight / 2
      const color = 'rgba(0,0,0,0.5)'
      for (let i = 0; i < 4; i++) {
        if (shadowBits & (1 << i)) {
          const dx1 = dx + (i % 2) * w1
          const dy1 = dy + Math.floor(i / 2) * h1
          bitmap.fillRect(dx1, dy1, w1, h1, color)
        }
      }
    }
  }

  /**
  * @method _readMapData
  * @param {Number} x
  * @param {Number} y
  * @param {Number} z
  * @return {Number}
  * @private
  */
  _readMapData(x, y, z) {
    if (this._mapData) {
      const width = this._mapWidth
      const height = this._mapHeight
      if (this.horizontalWrap) {
        x = x.mod(width)
      }
      if (this.verticalWrap) {
        y = y.mod(height)
      }
      if (x >= 0 && x < width && y >= 0 && y < height) {
        return this._mapData[(z * height + y) * width + x] || 0
      } else {
        return 0
      }
    } else {
      return 0
    }
  }

  /**
  * @method _isHigherTile
  * @param {Number} tileId
  * @return {Boolean}
  * @private
  */
  _isHigherTile(tileId) {
    return this.flags[tileId] & 0x10
  }

  /**
  * @method _isTableTile
  * @param {Number} tileId
  * @return {Boolean}
  * @private
  */
  _isTableTile(tileId) {
    return Tilemap.isTileA2(tileId) && this.flags[tileId] & 0x80
  }

  /**
  * @method _isOverpassPosition
  * @param {Number} mx
  * @param {Number} my
  * @return {Boolean}
  * @private
  */
  _isOverpassPosition(mx, my) {
    return false
  }

  /**
  * @method _sortChildren
  * @private
  */
  _sortChildren() {
    this.children.sort(this._compareChildOrder.bind(this))
  }

  /**
  * @method _compareChildOrder
  * @param {Object} a
  * @param {Object} b
  * @private
  */
  _compareChildOrder(a, b) {
    if (a.z !== b.z) {
      return a.z - b.z
    } else if (a.y !== b.y) {
      return a.y - b.y
    } else {
      return a.spriteId - b.spriteId
    }
  }

  // Tile type checkers

  static TILE_ID_B = 0
  static TILE_ID_C = 256
  static TILE_ID_D = 512
  static TILE_ID_E = 768
  static TILE_ID_A5 = 1536
  static TILE_ID_A1 = 2048
  static TILE_ID_A2 = 2816
  static TILE_ID_A3 = 4352
  static TILE_ID_A4 = 5888
  static TILE_ID_MAX = 8192

  static isVisibleTile(tileId) {
    return tileId > 0 && tileId < this.TILE_ID_MAX
  }

  static isAutotile(tileId) {
    return tileId >= this.TILE_ID_A1
  }

  static getAutotileKind(tileId) {
    return Math.floor((tileId - this.TILE_ID_A1) / 48)
  }

  static getAutotileShape(tileId) {
    return (tileId - this.TILE_ID_A1) % 48
  }

  static makeAutotileId(kind, shape) {
    return this.TILE_ID_A1 + kind * 48 + shape
  }

  static isSameKindTile(tileID1, tileID2) {
    if (this.isAutotile(tileID1) && this.isAutotile(tileID2)) {
      return this.getAutotileKind(tileID1) === this.getAutotileKind(tileID2)
    } else {
      return tileID1 === tileID2
    }
  }

  static isTileA1(tileId) {
    return tileId >= this.TILE_ID_A1 && tileId < this.TILE_ID_A2
  }

  static isTileA2(tileId) {
    return tileId >= this.TILE_ID_A2 && tileId < this.TILE_ID_A3
  }

  static isTileA3(tileId) {
    return tileId >= this.TILE_ID_A3 && tileId < this.TILE_ID_A4
  }

  static isTileA4(tileId) {
    return tileId >= this.TILE_ID_A4 && tileId < this.TILE_ID_MAX
  }

  static isTileA5(tileId) {
    return tileId >= this.TILE_ID_A5 && tileId < this.TILE_ID_A1
  }

  static isWaterTile(tileId) {
    if (this.isTileA1(tileId)) {
      return !(tileId >= this.TILE_ID_A1 + 96 && tileId < this.TILE_ID_A1 + 192)
    } else {
      return false
    }
  }

  static isWaterfallTile(tileId) {
    if (tileId >= this.TILE_ID_A1 + 192 && tileId < this.TILE_ID_A2) {
      return this.getAutotileKind(tileId) % 2 === 1
    } else {
      return false
    }
  }

  static isGroundTile(tileId) {
    return (
      this.isTileA1(tileId) || this.isTileA2(tileId) || this.isTileA5(tileId)
    )
  }

  static isShadowingTile(tileId) {
    return this.isTileA3(tileId) || this.isTileA4(tileId)
  }

  static isRoofTile(tileId) {
    return this.isTileA3(tileId) && this.getAutotileKind(tileId) % 16 < 8
  }

  static isWallTopTile(tileId) {
    return this.isTileA4(tileId) && this.getAutotileKind(tileId) % 16 < 8
  }

  static isWallSideTile(tileId) {
    return (
      (this.isTileA3(tileId) || this.isTileA4(tileId)) &&
      this.getAutotileKind(tileId) % 16 >= 8
    )
  }

  static isWallTile(tileId) {
    return this.isWallTopTile(tileId) || this.isWallSideTile(tileId)
  }

  static isFloorTypeAutotile(tileId) {
    return (
      (this.isTileA1(tileId) && !this.isWaterfallTile(tileId)) ||
      this.isTileA2(tileId) ||
      this.isWallTopTile(tileId)
    )
  }

  static isWallTypeAutotile(tileId) {
    return this.isRoofTile(tileId) || this.isWallSideTile(tileId)
  }

  static isWaterfallTypeAutotile(tileId) {
    return this.isWaterfallTile(tileId)
  }

  // Autotile shape number to coordinates of tileset images

  static FLOOR_AUTOTILE_TABLE = [
    [[2, 4], [1, 4], [2, 3], [1, 3]],
    [[2, 0], [1, 4], [2, 3], [1, 3]],
    [[2, 4], [3, 0], [2, 3], [1, 3]],
    [[2, 0], [3, 0], [2, 3], [1, 3]],
    [[2, 4], [1, 4], [2, 3], [3, 1]],
    [[2, 0], [1, 4], [2, 3], [3, 1]],
    [[2, 4], [3, 0], [2, 3], [3, 1]],
    [[2, 0], [3, 0], [2, 3], [3, 1]],
    [[2, 4], [1, 4], [2, 1], [1, 3]],
    [[2, 0], [1, 4], [2, 1], [1, 3]],
    [[2, 4], [3, 0], [2, 1], [1, 3]],
    [[2, 0], [3, 0], [2, 1], [1, 3]],
    [[2, 4], [1, 4], [2, 1], [3, 1]],
    [[2, 0], [1, 4], [2, 1], [3, 1]],
    [[2, 4], [3, 0], [2, 1], [3, 1]],
    [[2, 0], [3, 0], [2, 1], [3, 1]],
    [[0, 4], [1, 4], [0, 3], [1, 3]],
    [[0, 4], [3, 0], [0, 3], [1, 3]],
    [[0, 4], [1, 4], [0, 3], [3, 1]],
    [[0, 4], [3, 0], [0, 3], [3, 1]],
    [[2, 2], [1, 2], [2, 3], [1, 3]],
    [[2, 2], [1, 2], [2, 3], [3, 1]],
    [[2, 2], [1, 2], [2, 1], [1, 3]],
    [[2, 2], [1, 2], [2, 1], [3, 1]],
    [[2, 4], [3, 4], [2, 3], [3, 3]],
    [[2, 4], [3, 4], [2, 1], [3, 3]],
    [[2, 0], [3, 4], [2, 3], [3, 3]],
    [[2, 0], [3, 4], [2, 1], [3, 3]],
    [[2, 4], [1, 4], [2, 5], [1, 5]],
    [[2, 0], [1, 4], [2, 5], [1, 5]],
    [[2, 4], [3, 0], [2, 5], [1, 5]],
    [[2, 0], [3, 0], [2, 5], [1, 5]],
    [[0, 4], [3, 4], [0, 3], [3, 3]],
    [[2, 2], [1, 2], [2, 5], [1, 5]],
    [[0, 2], [1, 2], [0, 3], [1, 3]],
    [[0, 2], [1, 2], [0, 3], [3, 1]],
    [[2, 2], [3, 2], [2, 3], [3, 3]],
    [[2, 2], [3, 2], [2, 1], [3, 3]],
    [[2, 4], [3, 4], [2, 5], [3, 5]],
    [[2, 0], [3, 4], [2, 5], [3, 5]],
    [[0, 4], [1, 4], [0, 5], [1, 5]],
    [[0, 4], [3, 0], [0, 5], [1, 5]],
    [[0, 2], [3, 2], [0, 3], [3, 3]],
    [[0, 2], [1, 2], [0, 5], [1, 5]],
    [[0, 4], [3, 4], [0, 5], [3, 5]],
    [[2, 2], [3, 2], [2, 5], [3, 5]],
    [[0, 2], [3, 2], [0, 5], [3, 5]],
    [[0, 0], [1, 0], [0, 1], [1, 1]]
  ]

  static WALL_AUTOTILE_TABLE = [
    [[2, 2], [1, 2], [2, 1], [1, 1]],
    [[0, 2], [1, 2], [0, 1], [1, 1]],
    [[2, 0], [1, 0], [2, 1], [1, 1]],
    [[0, 0], [1, 0], [0, 1], [1, 1]],
    [[2, 2], [3, 2], [2, 1], [3, 1]],
    [[0, 2], [3, 2], [0, 1], [3, 1]],
    [[2, 0], [3, 0], [2, 1], [3, 1]],
    [[0, 0], [3, 0], [0, 1], [3, 1]],
    [[2, 2], [1, 2], [2, 3], [1, 3]],
    [[0, 2], [1, 2], [0, 3], [1, 3]],
    [[2, 0], [1, 0], [2, 3], [1, 3]],
    [[0, 0], [1, 0], [0, 3], [1, 3]],
    [[2, 2], [3, 2], [2, 3], [3, 3]],
    [[0, 2], [3, 2], [0, 3], [3, 3]],
    [[2, 0], [3, 0], [2, 3], [3, 3]],
    [[0, 0], [3, 0], [0, 3], [3, 3]]
  ]

  static WATERFALL_AUTOTILE_TABLE = [
    [[2, 0], [1, 0], [2, 1], [1, 1]],
    [[0, 0], [1, 0], [0, 1], [1, 1]],
    [[2, 0], [3, 0], [2, 1], [3, 1]],
    [[0, 0], [3, 0], [0, 1], [3, 1]]
  ]

  // The important members from Pixi.js

  /**
  * [read-only] The array of children of the tilemap.
  *
  * @property children
  * @type Array
  */

  /**
  * [read-only] The object that contains the tilemap.
  *
  * @property parent
  * @type Object
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
}

//-----------------------------------------------------------------------------
/**
* The tilemap which displays 2D tile-based game map using shaders
*
* @class Tilemap
* @constructor
*/

// Why on earth are these just thrown around like this?????????????
// we need this constant for some platforms (Samsung S4, S5, Tab4, HTC One H8)
PIXI.glCore.VertexArrayObject.FORCE_NATIVE = true
PIXI.settings.GC_MODE = PIXI.GC_MODES.AUTO
PIXI.tilemap.TileRenderer.SCALE_MODE = PIXI.SCALE_MODES.NEAREST
PIXI.tilemap.TileRenderer.DO_CLEAR = true

class ShaderTilemap extends Tilemap {
  constructor() {
    super()
    this.roundPixels = true
  }

  /**
  * Uploads animation state in renderer
  *
  * @method _hackRenderer
  * @private
  */
  _hackRenderer(renderer) {
    const af = this.animationFrame % 4
    if (af == 3) af = 1
    renderer.plugins.tilemap.tileAnim[0] = af * this._tileWidth
    renderer.plugins.tilemap.tileAnim[1] =
      (this.animationFrame % 3) * this._tileHeight
    return renderer
  }

  /**
  * PIXI render method
  *
  * @method renderCanvas
  * @param {Object} pixi renderer
  */
  renderCanvas(renderer) {
    this._hackRenderer(renderer)
    PIXI.Container.prototype.renderCanvas.call(this, renderer)
  }

  /**
  * PIXI render method
  *
  * @method renderWebGL
  * @param {Object} pixi renderer
  */
  renderWebGL(renderer) {
    this._hackRenderer(renderer)
    PIXI.Container.prototype.renderWebGL.call(this, renderer)
  }

  /**
  * Forces to repaint the entire tilemap AND update bitmaps list if needed
  *
  * @method refresh
  */
  refresh() {
    if (this._lastBitmapLength !== this.bitmaps.length) {
      this._lastBitmapLength = this.bitmaps.length
      this.refreshTileset()
    }
    this._needsRepaint = true
  }

  /**
  * Call after you update tileset
  *
  * @method updateBitmaps
  */
  refreshTileset() {
    const bitmaps = this.bitmaps.map(
      x => (x._baseTexture ? new PIXI.Texture(x._baseTexture) : x)
    )
    this.lowerLayer.setBitmaps(bitmaps)
    this.upperLayer.setBitmaps(bitmaps)
  }

  /**
  * @method updateTransform
  * @private
  */
  updateTransform() {
    const ox = this.roundPixels ? Math.floor(this.origin.x) : this.origin.x
    const oy = this.roundPixels ? Math.floor(this.origin.y) : this.origin.y
    const startX = Math.floor((ox - this._margin) / this._tileWidth)
    const startY = Math.floor((oy - this._margin) / this._tileHeight)
    this._updateLayerPositions(startX, startY)
    if (
      this._needsRepaint ||
      this._lastStartX !== startX ||
      this._lastStartY !== startY
    ) {
      this._lastStartX = startX
      this._lastStartY = startY
      this._paintAllTiles(startX, startY)
      this._needsRepaint = false
    }
    this._sortChildren()
    PIXI.Container.prototype.updateTransform.call(this)
  }

  /**
  * @method _createLayers
  * @private
  */
  _createLayers() {
    const width = this._width
    const height = this._height
    // unused???
    // const margin = this._margin
    const tileCols = Math.ceil(width / this._tileWidth) + 1
    const tileRows = Math.ceil(height / this._tileHeight) + 1
    const layerWidth = (this._layerWidth = tileCols * this._tileWidth)
    const layerHeight = (this._layerHeight = tileRows * this._tileHeight)
    this._needsRepaint = true

    if (!this.lowerZLayer) {
      //@hackerham: create layers only in initialization. Doesn't depend on width/height
      this.addChild((this.lowerZLayer = new PIXI.tilemap.ZLayer(this, 0)))
      this.addChild((this.upperZLayer = new PIXI.tilemap.ZLayer(this, 4)))

      const parameters = PluginManager.parameters('ShaderTilemap')
      const useSquareShader = Number(
        parameters.hasOwnProperty('squareShader')
          ? parameters['squareShader']
          : 0
      )

      this.lowerZLayer.addChild(
        (this.lowerLayer = new PIXI.tilemap.CompositeRectTileLayer(
          0,
          [],
          useSquareShader
        ))
      )
      this.lowerLayer.shadowColor = new Float32Array([0.0, 0.0, 0.0, 0.5])
      this.upperZLayer.addChild(
        (this.upperLayer = new PIXI.tilemap.CompositeRectTileLayer(
          4,
          [],
          useSquareShader
        ))
      )
    }
  }

  /**
  * @method _updateLayerPositions
  * @param {Number} startX
  * @param {Number} startY
  * @private
  */
  _updateLayerPositions(startX, startY) {
    const ox = this.roundPixels ? Math.floor(this.origin.x) : this.origin.x
    const oy = this.roundPixels ? Math.floor(this.origin.y) : this.origin.y
    this.lowerZLayer.position.x = startX * this._tileWidth - ox
    this.lowerZLayer.position.y = startY * this._tileHeight - oy
    this.upperZLayer.position.x = startX * this._tileWidth - ox
    this.upperZLayer.position.y = startY * this._tileHeight - oy
  }

  /**
  * @method _paintAllTiles
  * @param {Number} startX
  * @param {Number} startY
  * @private
  */
  _paintAllTiles(startX, startY) {
    this.lowerZLayer.clear()
    this.upperZLayer.clear()
    const tileCols = Math.ceil(this._width / this._tileWidth) + 1
    const tileRows = Math.ceil(this._height / this._tileHeight) + 1
    for (let y = 0; y < tileRows; y++) {
      for (let x = 0; x < tileCols; x++) {
        this._paintTiles(startX, startY, x, y)
      }
    }
  }

  /**
  * @method _paintTiles
  * @param {Number} startX
  * @param {Number} startY
  * @param {Number} x
  * @param {Number} y
  * @private
  */
  _paintTiles(startX, startY, x, y) {
    const mx = startX + x
    const my = startY + y
    const dx = x * this._tileWidth,
      dy = y * this._tileHeight
    const tileId0 = this._readMapData(mx, my, 0)
    const tileId1 = this._readMapData(mx, my, 1)
    const tileId2 = this._readMapData(mx, my, 2)
    const tileId3 = this._readMapData(mx, my, 3)
    const shadowBits = this._readMapData(mx, my, 4)
    const upperTileId1 = this._readMapData(mx, my - 1, 1)
    const lowerLayer = this.lowerLayer.children[0]
    const upperLayer = this.upperLayer.children[0]

    if (this._isHigherTile(tileId0)) {
      this._drawTile(upperLayer, tileId0, dx, dy)
    } else {
      this._drawTile(lowerLayer, tileId0, dx, dy)
    }
    if (this._isHigherTile(tileId1)) {
      this._drawTile(upperLayer, tileId1, dx, dy)
    } else {
      this._drawTile(lowerLayer, tileId1, dx, dy)
    }

    this._drawShadow(lowerLayer, shadowBits, dx, dy)
    if (this._isTableTile(upperTileId1) && !this._isTableTile(tileId1)) {
      if (!Tilemap.isShadowingTile(tileId0)) {
        this._drawTableEdge(lowerLayer, upperTileId1, dx, dy)
      }
    }

    if (this._isOverpassPosition(mx, my)) {
      this._drawTile(upperLayer, tileId2, dx, dy)
      this._drawTile(upperLayer, tileId3, dx, dy)
    } else {
      if (this._isHigherTile(tileId2)) {
        this._drawTile(upperLayer, tileId2, dx, dy)
      } else {
        this._drawTile(lowerLayer, tileId2, dx, dy)
      }
      if (this._isHigherTile(tileId3)) {
        this._drawTile(upperLayer, tileId3, dx, dy)
      } else {
        this._drawTile(lowerLayer, tileId3, dx, dy)
      }
    }
  }

  /**
  * @method _drawTile
  * @param {Array} layers
  * @param {Number} tileId
  * @param {Number} dx
  * @param {Number} dy
  * @private
  */
  _drawTile(layer, tileId, dx, dy) {
    if (Tilemap.isVisibleTile(tileId)) {
      if (Tilemap.isAutotile(tileId)) {
        this._drawAutotile(layer, tileId, dx, dy)
      } else {
        this._drawNormalTile(layer, tileId, dx, dy)
      }
    }
  }

  /**
  * @method _drawNormalTile
  * @param {Array} layers
  * @param {Number} tileId
  * @param {Number} dx
  * @param {Number} dy
  * @private
  */
  _drawNormalTile(layer, tileId, dx, dy) {
    let setNumber = 0

    if (Tilemap.isTileA5(tileId)) {
      setNumber = 4
    } else {
      setNumber = 5 + Math.floor(tileId / 256)
    }

    const w = this._tileWidth
    const h = this._tileHeight
    const sx = ((Math.floor(tileId / 128) % 2) * 8 + tileId % 8) * w
    const sy = (Math.floor((tileId % 256) / 8) % 16) * h

    layer.addRect(setNumber, sx, sy, dx, dy, w, h)
  }

  /**
  * @method _drawAutotile
  * @param {Array} layers
  * @param {Number} tileId
  * @param {Number} dx
  * @param {Number} dy
  * @private
  */
  _drawAutotile(layer, tileId, dx, dy) {
    let autotileTable = Tilemap.FLOOR_AUTOTILE_TABLE
    const kind = Tilemap.getAutotileKind(tileId)
    const shape = Tilemap.getAutotileShape(tileId)
    const tx = kind % 8
    const ty = Math.floor(kind / 8)
    let bx = 0
    let by = 0
    let setNumber = 0
    let isTable = false
    let animX = 0,
      animY = 0

    if (Tilemap.isTileA1(tileId)) {
      setNumber = 0
      if (kind === 0) {
        animX = 2
        by = 0
      } else if (kind === 1) {
        animX = 2
        by = 3
      } else if (kind === 2) {
        bx = 6
        by = 0
      } else if (kind === 3) {
        bx = 6
        by = 3
      } else {
        bx = Math.floor(tx / 4) * 8
        by = ty * 6 + (Math.floor(tx / 2) % 2) * 3
        if (kind % 2 === 0) {
          animX = 2
        } else {
          bx += 6
          autotileTable = Tilemap.WATERFALL_AUTOTILE_TABLE
          animY = 1
        }
      }
    } else if (Tilemap.isTileA2(tileId)) {
      setNumber = 1
      bx = tx * 2
      by = (ty - 2) * 3
      isTable = this._isTableTile(tileId)
    } else if (Tilemap.isTileA3(tileId)) {
      setNumber = 2
      bx = tx * 2
      by = (ty - 6) * 2
      autotileTable = Tilemap.WALL_AUTOTILE_TABLE
    } else if (Tilemap.isTileA4(tileId)) {
      setNumber = 3
      bx = tx * 2
      by = Math.floor((ty - 10) * 2.5 + (ty % 2 === 1 ? 0.5 : 0))
      if (ty % 2 === 1) {
        autotileTable = Tilemap.WALL_AUTOTILE_TABLE
      }
    }

    const table = autotileTable[shape]
    const w1 = this._tileWidth / 2
    const h1 = this._tileHeight / 2
    for (var i = 0; i < 4; i++) {
      const qsx = table[i][0]
      const qsy = table[i][1]
      const sx1 = (bx * 2 + qsx) * w1
      const sy1 = (by * 2 + qsy) * h1
      const dx1 = dx + (i % 2) * w1
      const dy1 = dy + Math.floor(i / 2) * h1
      if (isTable && (qsy === 1 || qsy === 5)) {
        let qsx2 = qsx
        const qsy2 = 3
        if (qsy === 1) {
          //qsx2 = [0, 3, 2, 1][qsx];
          qsx2 = (4 - qsx) % 4
        }
        const sx2 = (bx * 2 + qsx2) * w1
        const sy2 = (by * 2 + qsy2) * h1
        layer.addRect(setNumber, sx2, sy2, dx1, dy1, w1, h1, animX, animY)
        layer.addRect(
          setNumber,
          sx1,
          sy1,
          dx1,
          dy1 + h1 / 2,
          w1,
          h1 / 2,
          animX,
          animY
        )
      } else {
        layer.addRect(setNumber, sx1, sy1, dx1, dy1, w1, h1, animX, animY)
      }
    }
  }

  /**
  * @method _drawTableEdge
  * @param {Array} layers
  * @param {Number} tileId
  * @param {Number} dx
  * @param {Number} dy
  * @private
  */
  _drawTableEdge(layer, tileId, dx, dy) {
    if (Tilemap.isTileA2(tileId)) {
      const autotileTable = Tilemap.FLOOR_AUTOTILE_TABLE
      const kind = Tilemap.getAutotileKind(tileId)
      const shape = Tilemap.getAutotileShape(tileId)
      const tx = kind % 8
      const ty = Math.floor(kind / 8)
      const setNumber = 1
      const bx = tx * 2
      const by = (ty - 2) * 3
      const table = autotileTable[shape]
      const w1 = this._tileWidth / 2
      const h1 = this._tileHeight / 2
      for (let i = 0; i < 2; i++) {
        const qsx = table[2 + i][0]
        const qsy = table[2 + i][1]
        const sx1 = (bx * 2 + qsx) * w1
        const sy1 = (by * 2 + qsy) * h1 + h1 / 2
        const dx1 = dx + (i % 2) * w1
        const dy1 = dy + Math.floor(i / 2) * h1
        layer.addRect(setNumber, sx1, sy1, dx1, dy1, w1, h1 / 2)
      }
    }
  }

  /**
  * @method _drawShadow
  * @param {Number} shadowBits
  * @param {Number} dx
  * @param {Number} dy
  * @private
  */
  _drawShadow(layer, shadowBits, dx, dy) {
    if (shadowBits & 0x0f) {
      const w1 = this._tileWidth / 2
      const h1 = this._tileHeight / 2
      for (let i = 0; i < 4; i++) {
        if (shadowBits & (1 << i)) {
          const dx1 = dx + (i % 2) * w1
          const dy1 = dy + Math.floor(i / 2) * h1
          layer.addRect(-1, 0, 0, dx1, dy1, w1, h1)
        }
      }
    }
  }
}

export { Tilemap, ShaderTilemap }
