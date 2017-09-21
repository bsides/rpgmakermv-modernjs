import { Bitmap } from './core/Bitmap'
import { Utils, JsExtensions } from './core/Utils'
import { CacheEntry, CacheMap, ImageCache, RequestQueue } from './core/cache'
import './core/native'
import { Point, Rectangle } from './core/pixi'
import { Graphics } from './core/Graphics'
import { Input } from './core/Input'
import { TouchInput } from './core/TouchInput'
import { Sprite } from './core/Sprite'
import { TilingSprite } from './core/TilingSprite'
import { Tilemap, ShaderTilemap } from './core/tilemap'
import { ScreenSprite } from './core/ScreenSprite'
import { Window } from './core/Window'
import { WindowLayer } from './core/WindowLayer'
import { Weather } from './core/Weather'
import { ToneFilter, ToneSprite } from './core/tone'
import { Stage } from './core/Stage'
import { WebAudio, Html5Audio } from './core/audio'
import { JsonEx, Decrypter, ResourceHandler } from './core/misc'

//=============================================================================
// rpg_core.js v1.5.1
//=============================================================================

window.Bitmap = Bitmap

window.Utils = Utils
window.JsExtensions = JsExtensions

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

window.Weather = Weather

window.ToneFilter = ToneFilter
window.ToneSprite = ToneSprite

window.Stage = Stage

window.WebAudio = WebAudio
window.Html5Audio = Html5Audio

window.JsonEx = JsonEx
window.Decrypter = Decrypter
window.ResourceHandler = ResourceHandler
