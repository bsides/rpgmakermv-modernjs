//-----------------------------------------------------------------------------
/**
 * The point class.
 *
 * @class Point
 * @constructor
 * @param {Number} x The x coordinate
 * @param {Number} y The y coordinate
 */
class Point extends PIXI.Point {
  constructor(x, y) {
    super(x, y)
  }
}

//-----------------------------------------------------------------------------
/**
 * The rectangle class.
 *
 * @class Rectangle
 * @constructor
 * @param {Number} x The x coordinate for the upper-left corner
 * @param {Number} y The y coordinate for the upper-left corner
 * @param {Number} width The width of the rectangle
 * @param {Number} height The height of the rectangle
 */

class Rectangle extends PIXI.Rectangle {
  /**
   * @static
   * @property emptyRectangle
   * @type Rectangle
   * @private
   */
  static emptyRectangle = new Rectangle(0, 0, 0, 0)
  /**
   * The x coordinate for the upper-left corner.
   *
   * @property x
   * @type Number
   */

  /**
   * The y coordinate for the upper-left corner.
   *
   * @property y
   * @type Number
   */

  /**
   * The width of the rectangle.
   *
   * @property width
   * @type Number
   */

  /**
   * The height of the rectangle.
   *
   * @property height
   * @type Number
   */

  constructor(x, y, width, height) {
    super(x, y, width, height)
  }
}

export { Point, Rectangle }
