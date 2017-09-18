import { Bitmap } from './core/bitmap'
import { Utils } from './core/utils'
import { CacheEntry, CacheMap, ImageCache, RequestQueue } from './core/cache'
import './core/native'
import { Point, Rectangle } from './core/pixi'
import { Graphics } from './core/graphics'
import { Input } from './core/input'
import { TouchInput } from './core/touchInput'
import { Sprite, TilingSprite } from './core/sprite'
import { Tilemap, ShaderTilemap } from './core/tilemap'
import { ScreenSprite } from './core/screenSprite'
import { Window } from './core/window'
import { WindowLayer } from './core/windowLayer'

window.Bitmap = Bitmap

window.Utils = Utils

window.CacheEntry = CacheEntry
window.CacheMap = CacheMap
window.ImageCache = ImageCache
window.RequestQueue = RequestQueue

window.Point = Point
window.Rectangle = Rectangle

window.Graphics = Graphics

window.Input = Input

window.TouchInput = TouchInput

window.Sprite = Sprite
window.TilingSprite = TilingSprite

window.Tilemap = Tilemap
window.ShaderTilemap = ShaderTilemap

window.ScreenSprite = ScreenSprite

window.Window = Window

window.WindowLayer = WindowLayer
