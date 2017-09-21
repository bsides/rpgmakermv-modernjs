//-----------------------------------------------------------------------------
/**
* The color matrix filter for WebGL.
*
* @class ToneFilter
* @extends PIXI.Filter
* @constructor
*/
class ToneFilter extends PIXI.filters.ColorMatrixFilter {
  constructor() {
    super()
  }

  /**
  * Changes the hue.
  *
  * @method adjustHue
  * @param {Number} value The hue value in the range (-360, 360)
  */
  adjustHue(value) {
    this.hue(value, true)
  }

  /**
  * Changes the saturation.
  *
  * @method adjustSaturation
  * @param {Number} value The saturation value in the range (-255, 255)
  */
  adjustSaturation(value) {
    value = (value || 0).clamp(-255, 255) / 255
    this.saturate(value, true)
  }

  /**
  * Changes the tone.
  *
  * @method adjustTone
  * @param {Number} r The red strength in the range (-255, 255)
  * @param {Number} g The green strength in the range (-255, 255)
  * @param {Number} b The blue strength in the range (-255, 255)
  */
  adjustTone(r, g, b) {
    r = (r || 0).clamp(-255, 255) / 255
    g = (g || 0).clamp(-255, 255) / 255
    b = (b || 0).clamp(-255, 255) / 255

    if (r !== 0 || g !== 0 || b !== 0) {
      const matrix = [
        1,
        0,
        0,
        r,
        0,
        0,
        1,
        0,
        g,
        0,
        0,
        0,
        1,
        b,
        0,
        0,
        0,
        0,
        1,
        0
      ]

      this._loadMatrix(matrix, true)
    }
  }
}

//-----------------------------------------------------------------------------
/**
* The sprite which changes the screen color in 2D canvas mode.
*
* @class ToneSprite
* @constructor
*/
class ToneSprite extends PIXI.Container {
  constructor() {
    super()
  }
  initialize() {
    // PIXI.Container.call(this)
    this.clear()
  }

  /**
  * Clears the tone.
  *
  * @method reset
  */
  clear() {
    this._red = 0
    this._green = 0
    this._blue = 0
    this._gray = 0
  }

  /**
  * Sets the tone.
  *
  * @method setTone
  * @param {Number} r The red strength in the range (-255, 255)
  * @param {Number} g The green strength in the range (-255, 255)
  * @param {Number} b The blue strength in the range (-255, 255)
  * @param {Number} gray The grayscale level in the range (0, 255)
  */
  setTone(r, g, b, gray) {
    this._red = Math.round(r || 0).clamp(-255, 255)
    this._green = Math.round(g || 0).clamp(-255, 255)
    this._blue = Math.round(b || 0).clamp(-255, 255)
    this._gray = Math.round(gray || 0).clamp(0, 255)
  }

  /**
  * @method _renderCanvas
  * @param {Object} renderSession
  * @private
  */
  _renderCanvas(renderer) {
    if (this.visible) {
      const context = renderer.context
      const t = this.worldTransform
      const r = renderer.resolution
      const width = Graphics.width
      const height = Graphics.height
      context.save()
      context.setTransform(t.a, t.b, t.c, t.d, t.tx * r, t.ty * r)
      if (Graphics.canUseSaturationBlend() && this._gray > 0) {
        context.globalCompositeOperation = 'saturation'
        context.globalAlpha = this._gray / 255
        context.fillStyle = '#ffffff'
        context.fillRect(0, 0, width, height)
      }
      context.globalAlpha = 1
      const r1 = Math.max(0, this._red)
      const g1 = Math.max(0, this._green)
      const b1 = Math.max(0, this._blue)
      if (r1 || g1 || b1) {
        context.globalCompositeOperation = 'lighter'
        context.fillStyle = Utils.rgbToCssColor(r1, g1, b1)
        context.fillRect(0, 0, width, height)
      }
      if (Graphics.canUseDifferenceBlend()) {
        const r2 = Math.max(0, -this._red)
        const g2 = Math.max(0, -this._green)
        const b2 = Math.max(0, -this._blue)
        if (r2 || g2 || b2) {
          context.globalCompositeOperation = 'difference'
          context.fillStyle = '#ffffff'
          context.fillRect(0, 0, width, height)
          context.globalCompositeOperation = 'lighter'
          context.fillStyle = Utils.rgbToCssColor(r2, g2, b2)
          context.fillRect(0, 0, width, height)
          context.globalCompositeOperation = 'difference'
          context.fillStyle = '#ffffff'
          context.fillRect(0, 0, width, height)
        }
      }
      context.restore()
    }
  }

  /**
  * @method _renderWebGL
  * @param {Object} renderSession
  * @private
  */
  _renderWebGL(renderer) {
    // Not supported
  }
}

export { ToneFilter, ToneSprite }
