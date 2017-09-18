(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['./bitmap'], factory);
  } else if (typeof exports !== "undefined") {
    factory(require('./bitmap'));
  } else {
    var mod = {
      exports: {}
    };
    factory(global.bitmap);
    global.rpg_core = mod.exports;
  }
})(this, function (_bitmap) {
  'use strict';

  var _bitmap2 = _interopRequireDefault(_bitmap);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }
});
//# sourceMappingURL=rpg_core.js.map