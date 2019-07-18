
// ROTATED MARKER

(function() {
    // save these original methods before they are overwritten
    var proto_initIcon = L.Marker.prototype._initIcon;
    var proto_setPos = L.Marker.prototype._setPos;

    var oldIE = (L.DomUtil.TRANSFORM === 'msTransform');

    L.Marker.addInitHook(function () {
        var iconOptions = this.options.icon && this.options.icon.options;
        var iconAnchor = iconOptions && this.options.icon.options.iconAnchor;
        if (iconAnchor) {
            iconAnchor = (iconAnchor[0] + 'px ' + iconAnchor[1] + 'px');
        }
        this.options.rotationOrigin = this.options.rotationOrigin || iconAnchor || 'center bottom' ;
        this.options.rotationAngle = this.options.rotationAngle || 0;

        // Ensure marker keeps rotated during dragging
        this.on('drag', function(e) { e.target._applyRotation(); });
    });

    L.Marker.include({
        _initIcon: function() {
            proto_initIcon.call(this);
        },

        _setPos: function (pos) {
            proto_setPos.call(this, pos);
            this._applyRotation();
        },

        _applyRotation: function () {
            if(this.options.rotationAngle) {
                this._icon.style[L.DomUtil.TRANSFORM+'Origin'] = this.options.rotationOrigin;

                if(oldIE) {
                    // for IE 9, use the 2D rotation
                    this._icon.style[L.DomUtil.TRANSFORM] = 'rotate(' + this.options.rotationAngle + 'deg)';
                } else {
                    // for modern browsers, prefer the 3D accelerated version
                    this._icon.style[L.DomUtil.TRANSFORM] += ' rotateZ(' + this.options.rotationAngle + 'deg)';
                }
            }
        },

        setRotationAngle: function(angle) {
            this.options.rotationAngle = angle;
            this.update();
            return this;
        },

        setRotationOrigin: function(origin) {
            this.options.rotationOrigin = origin;
            this.update();
            return this;
        }
    });
})();


// Leaflet zoom control with a home button for resetting the view.
 
(function () {
    "use strict";

    L.Control.ZoomHome = L.Control.Zoom.extend({
        options: {
            position: 'topleft',
            zoomInText: '<p style="text-align:center;line-height:1.8;font-size:18px">+</p>',
            zoomInTitle: 'Zoom in',
            zoomOutText: '<p style="text-align:center;line-height:1.8;font-size:18px">-</p>',
            zoomOutTitle: 'Zoom out',
            zoomHomeText: 'home',
            zoomHomeTitle: 'Home',
            homeCoordinates: null,
            homeZoom: null
        },

        onAdd: function (map) {
            var controlName = 'leaflet-control-zoomhome',
                container = L.DomUtil.create('div', controlName + ' leaflet-bar'),
                options = this.options;

            if (options.homeCoordinates === null) {
                options.homeCoordinates = map.getCenter();
            }
            if (options.homeZoom === null) {
                options.homeZoom = map.getZoom();
            }

            this._zoomInButton = this._createButton(options.zoomInText, options.zoomInTitle,
                controlName + '-in', container, this._zoomIn.bind(this));
            var zoomHomeText = '<i class="material-icons" style="text-align:center;line-height:1.8;font-size:17px">' + options.zoomHomeText + '</i>';
            this._zoomHomeButton = this._createButton(zoomHomeText, options.zoomHomeTitle,
                controlName + '-home', container, this._zoomHome.bind(this));
            this._zoomOutButton = this._createButton(options.zoomOutText, options.zoomOutTitle,
                controlName + '-out', container, this._zoomOut.bind(this));

            this._updateDisabled();
            map.on('zoomend zoomlevelschange', this._updateDisabled, this);

            return container;
        },

        setHomeBounds: function (bounds) {
            if (bounds === undefined) {
                bounds = this._map.getBounds();
            } else {
                if (typeof bounds.getCenter !== 'function') {
                    bounds = L.latLngBounds(bounds);
                }
            }
            this.options.homeZoom = this._map.getBoundsZoom(bounds);
            this.options.homeCoordinates = bounds.getCenter();
        },

        setHomeCoordinates: function (coordinates) {
            if (coordinates === undefined) {
                coordinates = this._map.getCenter();
            }
            this.options.homeCoordinates = coordinates;
        },

        setHomeZoom: function (zoom) {
            if (zoom === undefined) {
                zoom = this._map.getZoom();
            }
            this.options.homeZoom = zoom;
        },

        getHomeZoom: function () {
            return this.options.homeZoom;
        },

        getHomeCoordinates: function () {
            return this.options.homeCoordinates;
        },

        _zoomHome: function (e) {
            this._map.setView(this.options.homeCoordinates, this.options.homeZoom);
        }
    });

    L.Control.zoomHome = function (options) {
        return new L.Control.ZoomHome(options);
    };
}());


// L.TileLayer.Grayscale is a regular tilelayer with grayscale makeover.


L.TileLayer.Grayscale = L.TileLayer.extend({
	options: {
		quotaRed: 21,
		quotaGreen: 71,
		quotaBlue: 8,
		quotaDividerTune: 0,
		quotaDivider: function() {
			return this.quotaRed + this.quotaGreen + this.quotaBlue + this.quotaDividerTune;
		}
	},

	initialize: function (url, options) {
		options = options || {}
		options.crossOrigin = true;
		L.TileLayer.prototype.initialize.call(this, url, options);

		this.on('tileload', function(e) {
			this._makeGrayscale(e.tile);
		});
	},

	_createTile: function () {
		var tile = L.TileLayer.prototype._createTile.call(this);
		tile.crossOrigin = "Anonymous";
		return tile;
	},

	_makeGrayscale: function (img) {
		if (img.getAttribute('data-grayscaled'))
			return;

                img.crossOrigin = '';
		var canvas = document.createElement("canvas");
		canvas.width = img.width;
		canvas.height = img.height;
		var ctx = canvas.getContext("2d");
		ctx.drawImage(img, 0, 0);

		var imgd = ctx.getImageData(0, 0, canvas.width, canvas.height);
		var pix = imgd.data;
		for (var i = 0, n = pix.length; i < n; i += 4) {
                        pix[i] = pix[i + 1] = pix[i + 2] = (this.options.quotaRed * pix[i] + this.options.quotaGreen * pix[i + 1] + this.options.quotaBlue * pix[i + 2]) / this.options.quotaDivider();
		}
		ctx.putImageData(imgd, 0, 0);
		img.setAttribute('data-grayscaled', true);
		img.src = canvas.toDataURL();
	}
});

L.tileLayer.grayscale = function (url, options) {
	return new L.TileLayer.Grayscale(url, options);
};

// Leaflet velocity

"use strict";

/*
 Generic  Canvas Layer for leaflet 0.7 and 1.0-rc,
 copyright Stanislav Sumbera,  2016 , sumbera.com , license MIT
 originally created and motivated by L.CanvasOverlay  available here: https://gist.github.com/Sumbera/11114288
 */
// -- L.DomUtil.setTransform from leaflet 1.0.0 to work on 0.0.7
//------------------------------------------------------------------------------
if (!L.DomUtil.setTransform) {
  L.DomUtil.setTransform = function (el, offset, scale) {
    var pos = offset || new L.Point(0, 0);
    el.style[L.DomUtil.TRANSFORM] = (L.Browser.ie3d ? "translate(" + pos.x + "px," + pos.y + "px)" : "translate3d(" + pos.x + "px," + pos.y + "px,0)") + (scale ? " scale(" + scale + ")" : "");
  };
} // -- support for both  0.0.7 and 1.0.0 rc2 leaflet


L.CanvasLayer = (L.Layer ? L.Layer : L.Class).extend({
  // -- initialized is called on prototype
  initialize: function initialize(options) {
    this._map = null;
    this._canvas = null;
    this._frame = null;
    this._delegate = null;
    L.setOptions(this, options);
  },
  delegate: function delegate(del) {
    this._delegate = del;
    return this;
  },
  needRedraw: function needRedraw() {
    if (!this._frame) {
      this._frame = L.Util.requestAnimFrame(this.drawLayer, this);
    }

    return this;
  },
  //-------------------------------------------------------------
  _onLayerDidResize: function _onLayerDidResize(resizeEvent) {
    this._canvas.width = resizeEvent.newSize.x;
    this._canvas.height = resizeEvent.newSize.y;
  },
  //-------------------------------------------------------------
  _onLayerDidMove: function _onLayerDidMove() {
    var topLeft = this._map.containerPointToLayerPoint([0, 0]);

    L.DomUtil.setPosition(this._canvas, topLeft);
    this.drawLayer();
  },
  //-------------------------------------------------------------
  getEvents: function getEvents() {
    var events = {
      resize: this._onLayerDidResize,
      moveend: this._onLayerDidMove
    };

    if (this._map.options.zoomAnimation && L.Browser.any3d) {
      events.zoomanim = this._animateZoom;
    }

    return events;
  },
  //-------------------------------------------------------------
  onAdd: function onAdd(map) {
    //console.log('canvas onAdd', this);
    this._map = map;
    this._canvas = L.DomUtil.create("canvas", "leaflet-layer");
    this.tiles = {};

    var size = this._map.getSize();

    this._canvas.width = size.x;
    this._canvas.height = size.y;
    var animated = this._map.options.zoomAnimation && L.Browser.any3d;
    L.DomUtil.addClass(this._canvas, "leaflet-zoom-" + (animated ? "animated" : "hide"));
    this.options.pane.appendChild(this._canvas);
    map.on(this.getEvents(), this);
    var del = this._delegate || this;
    del.onLayerDidMount && del.onLayerDidMount(); // -- callback

    this.needRedraw();
    var self = this;
    setTimeout(function () {
      self._onLayerDidMove();
    }, 0);
  },
  //-------------------------------------------------------------
  onRemove: function onRemove(map) {
    var del = this._delegate || this;
    del.onLayerWillUnmount && del.onLayerWillUnmount(); // -- callback

    this.options.pane.removeChild(this._canvas);
    map.off(this.getEvents(), this);
    this._canvas = null;
  },
  //------------------------------------------------------------
  addTo: function addTo(map) {
    map.addLayer(this);
    return this;
  },
  // --------------------------------------------------------------------------------
  LatLonToMercator: function LatLonToMercator(latlon) {
    return {
      x: latlon.lng * 6378137 * Math.PI / 180,
      y: Math.log(Math.tan((90 + latlon.lat) * Math.PI / 360)) * 6378137
    };
  },
  //------------------------------------------------------------------------------
  drawLayer: function drawLayer() {
    // -- todo make the viewInfo properties  flat objects.
    var size = this._map.getSize();

    var bounds = this._map.getBounds();

    var zoom = this._map.getZoom();

    var center = this.LatLonToMercator(this._map.getCenter());
    var corner = this.LatLonToMercator(this._map.containerPointToLatLng(this._map.getSize()));
    var del = this._delegate || this;
    del.onDrawLayer && del.onDrawLayer({
      layer: this,
      canvas: this._canvas,
      bounds: bounds,
      size: size,
      zoom: zoom,
      center: center,
      corner: corner
    });
    this._frame = null;
  },
  // -- L.DomUtil.setTransform from leaflet 1.0.0 to work on 0.0.7
  //------------------------------------------------------------------------------
  _setTransform: function _setTransform(el, offset, scale) {
    var pos = offset || new L.Point(0, 0);
    el.style[L.DomUtil.TRANSFORM] = (L.Browser.ie3d ? "translate(" + pos.x + "px," + pos.y + "px)" : "translate3d(" + pos.x + "px," + pos.y + "px,0)") + (scale ? " scale(" + scale + ")" : "");
  },
  //------------------------------------------------------------------------------
  _animateZoom: function _animateZoom(e) {
    var scale = this._map.getZoomScale(e.zoom); // -- different calc of offset in leaflet 1.0.0 and 0.0.7 thanks for 1.0.0-rc2 calc @jduggan1


    var offset = L.Layer ? this._map._latLngToNewLayerPoint(this._map.getBounds().getNorthWest(), e.zoom, e.center) : this._map._getCenterOffset(e.center)._multiplyBy(-scale).subtract(this._map._getMapPanePos());
    L.DomUtil.setTransform(this._canvas, offset, scale);
  }
});

L.canvasLayer = function (pane) {
  return new L.CanvasLayer(pane);
};

L.Control.Velocity = L.Control.extend({
  options: {
    position: "bottomleft",
    emptyString: "Unavailable",
    // Could be any combination of 'bearing' (angle toward which the flow goes) or 'meteo' (angle from which the flow comes)
    // and 'CW' (angle value increases clock-wise) or 'CCW' (angle value increases counter clock-wise)
    angleConvention: "bearingCCW",
    // Could be 'm/s' for meter per second, 'k/h' for kilometer per hour or 'kt' for knots
    speedUnit: "m/s",
    onAdd: null,
    onRemove: null
  },
  onAdd: function onAdd(map) {
    this._container = L.DomUtil.create("div", "leaflet-control-velocity");
    L.DomEvent.disableClickPropagation(this._container);
    map.on("mousemove", this._onMouseMove, this);
    this._container.innerHTML = this.options.emptyString;
    if (this.options.leafletVelocity.options.onAdd) this.options.leafletVelocity.options.onAdd();
    return this._container;
  },
  onRemove: function onRemove(map) {
    map.off("mousemove", this._onMouseMove, this);
    if (this.options.leafletVelocity.options.onRemove) this.options.leafletVelocity.options.onRemove();
  },
  vectorToSpeed: function vectorToSpeed(uMs, vMs, unit) {
    var velocityAbs = Math.sqrt(Math.pow(uMs, 2) + Math.pow(vMs, 2)); // Default is m/s

    if (unit === "k/h") {
      return this.meterSec2kilometerHour(velocityAbs);
    } else if (unit === "kt") {
      return this.meterSec2Knots(velocityAbs);
    } else {
      return velocityAbs;
    }
  },
  vectorToDegrees: function vectorToDegrees(uMs, vMs, angleConvention) {
    // Default angle convention is CW
    if (angleConvention.endsWith("CCW")) {
      // vMs comes out upside-down..
      vMs = vMs > 0 ? vMs = -vMs : Math.abs(vMs);
    }

    var velocityAbs = Math.sqrt(Math.pow(uMs, 2) + Math.pow(vMs, 2));
    var velocityDir = Math.atan2(uMs / velocityAbs, vMs / velocityAbs);
    var velocityDirToDegrees = velocityDir * 180 / Math.PI + 180;

    if (angleConvention === "bearingCW" || angleConvention === "meteoCCW") {
      velocityDirToDegrees += 180;
      if (velocityDirToDegrees >= 360) velocityDirToDegrees -= 360;
    }

    return velocityDirToDegrees;
  },
  meterSec2Knots: function meterSec2Knots(meters) {
    return meters / 0.514;
  },
  meterSec2kilometerHour: function meterSec2kilometerHour(meters) {
    return meters * 3.6;
  },
  _onMouseMove: function _onMouseMove(e) {
    var self = this;

    var pos = this.options.leafletVelocity._map.containerPointToLatLng(L.point(e.containerPoint.x, e.containerPoint.y));

    var gridValue = this.options.leafletVelocity._windy.interpolatePoint(pos.lng, pos.lat);

    var htmlOut = "";

    if (gridValue && !isNaN(gridValue[0]) && !isNaN(gridValue[1]) && gridValue[2]) {
      htmlOut = "<strong>" + this.options.velocityType + " Direction: </strong>" + self.vectorToDegrees(gridValue[0], gridValue[1], this.options.angleConvention).toFixed(2) + "°" + ", <strong>" + this.options.velocityType + " Speed: </strong>" + self.vectorToSpeed(gridValue[0], gridValue[1], this.options.speedUnit).toFixed(2) + this.options.speedUnit;
    } else {
      htmlOut = this.options.emptyString;
    }

    self._container.innerHTML = htmlOut;
  }
});
L.Map.mergeOptions({
  positionControl: false
});
L.Map.addInitHook(function () {
  if (this.options.positionControl) {
    this.positionControl = new L.Control.MousePosition();
    this.addControl(this.positionControl);
  }
});

L.control.velocity = function (options) {
  return new L.Control.Velocity(options);
};

L.VelocityLayer = (L.Layer ? L.Layer : L.Class).extend({
  options: {
    displayValues: true,
    displayOptions: {
      velocityType: "Velocity",
      position: "bottomleft",
      emptyString: "No velocity data"
    },
    maxVelocity: 10,
    // used to align color scale
    colorScale: null,
    data: null
  },
  _map: null,
  _canvasLayer: null,
  _windy: null,
  _context: null,
  _timer: 0,
  _mouseControl: null,
  initialize: function initialize(options) {
    L.setOptions(this, options);
  },
  onAdd: function onAdd(map) {
    // determine where to add the layer
    this._paneName = this.options.paneName || 'overlayPane'; // fall back to overlayPane for leaflet < 1

    var pane = map._panes.overlayPane;

    if (map.getPane) {
      // attempt to get pane first to preserve parent (createPane voids this)
      pane = map.getPane(this._paneName);

      if (!pane) {
        pane = map.createPane(this._paneName);
      }
    } // create canvas, add to map pane


    this._canvasLayer = L.canvasLayer({
      pane: pane
    }).delegate(this);

    this._canvasLayer.addTo(map);

    this._map = map;
  },
  onRemove: function onRemove(map) {
    this._destroyWind();
  },
  setData: function setData(data) {
    this.options.data = data;

    if (this._windy) {
      this._windy.setData(data);

      this._clearAndRestart();
    }

    this.fire("load");
  },
  setOptions: function setOptions(options) {
    this.options = Object.assign(this.options, options);

    if (options.hasOwnProperty("displayOptions")) {
      this.options.displayOptions = Object.assign(this.options.displayOptions, options.displayOptions);

      this._initMouseHandler(true);
    }

    if (options.hasOwnProperty("data")) this.options.data = options.data;

    if (this._windy) {
      this._windy.setOptions(options);

      if (options.hasOwnProperty("data")) this._windy.setData(options.data);

      this._clearAndRestart();
    }

    this.fire("load");
  },

  /*------------------------------------ PRIVATE ------------------------------------------*/
  onDrawLayer: function onDrawLayer(overlay, params) {
    var self = this;

    if (!this._windy) {
      this._initWindy(this);

      return;
    }

    if (!this.options.data) {
      return;
    }

    if (this._timer) clearTimeout(self._timer);
    this._timer = setTimeout(function () {
      self._startWindy();
    }, 750); // showing velocity is delayed
  },
  _startWindy: function _startWindy() {
    var bounds = this._map.getBounds();

    var size = this._map.getSize(); // bounds, width, height, extent


    this._windy.start([[0, 0], [size.x, size.y]], size.x, size.y, [[bounds._southWest.lng, bounds._southWest.lat], [bounds._northEast.lng, bounds._northEast.lat]]);
  },
  _initWindy: function _initWindy(self) {
    // windy object, copy options
    var options = Object.assign({
      canvas: self._canvasLayer._canvas
    }, self.options);
    this._windy = new Windy(options); // prepare context global var, start drawing

    this._context = this._canvasLayer._canvas.getContext("2d");

    this._canvasLayer._canvas.classList.add("velocity-overlay");

    this.onDrawLayer();

    this._map.on("dragstart", self._windy.stop);

    this._map.on("dragend", self._clearAndRestart);

    this._map.on("zoomstart", self._windy.stop);

    this._map.on("zoomend", self._clearAndRestart);

    this._map.on("resize", self._clearWind);

    this._initMouseHandler(false);
  },
  _initMouseHandler: function _initMouseHandler(voidPrevious) {
    if (voidPrevious) {
      this._map.removeControl(this._mouseControl);

      this._mouseControl = false;
    }

    if (!this._mouseControl && this.options.displayValues) {
      var options = this.options.displayOptions || {};
      options["leafletVelocity"] = this;
      this._mouseControl = L.control.velocity(options).addTo(this._map);
    }
  },
  _clearAndRestart: function _clearAndRestart() {
    if (this._context) this._context.clearRect(0, 0, 3000, 3000);
    if (this._windy) this._startWindy();
  },
  _clearWind: function _clearWind() {
    if (this._windy) this._windy.stop();
    if (this._context) this._context.clearRect(0, 0, 3000, 3000);
  },
  _destroyWind: function _destroyWind() {
    if (this._timer) clearTimeout(this._timer);
    if (this._windy) this._windy.stop();
    if (this._context) this._context.clearRect(0, 0, 3000, 3000);
    if (this._mouseControl) this._map.removeControl(this._mouseControl);
    this._mouseControl = null;
    this._windy = null;

    this._map.removeLayer(this._canvasLayer);
  }
});

L.velocityLayer = function (options) {
  return new L.VelocityLayer(options);
};
/*  Global class for simulating the movement of particle through a 1km wind grid
 credit: All the credit for this work goes to: https://github.com/cambecc for creating the repo:
 https://github.com/cambecc/earth. The majority of this code is directly take nfrom there, since its awesome.
 This class takes a canvas element and an array of data (1km GFS from http://www.emc.ncep.noaa.gov/index.php?branch=GFS)
 and then uses a mercator (forward/reverse) projection to correctly map wind vectors in "map space".
 The "start" method takes the bounds of the map at its current extent and starts the whole gridding,
 interpolation and animation process.
 */


var Windy = function Windy(params) {
  var MIN_VELOCITY_INTENSITY = params.minVelocity || 0; // velocity at which particle intensity is minimum (m/s)

  var MAX_VELOCITY_INTENSITY = params.maxVelocity || 10; // velocity at which particle intensity is maximum (m/s)

  var VELOCITY_SCALE = (params.velocityScale || 0.005) * (Math.pow(window.devicePixelRatio, 1 / 3) || 1); // scale for wind velocity (completely arbitrary--this value looks nice)

  var MAX_PARTICLE_AGE = params.particleAge || 80; // max number of frames a particle is drawn before regeneration

  var PARTICLE_LINE_WIDTH = params.lineWidth || 2; // line width of a drawn particle

  var PARTICLE_MULTIPLIER = params.particleMultiplier || 1 / 300; // particle count scalar (completely arbitrary--this values looks nice)

  var PARTICLE_REDUCTION = Math.pow(window.devicePixelRatio, 1 / 3) || 1.6; // multiply particle count for mobiles by this amount

  var FRAME_RATE = params.frameRate || 24;
  var FRAME_TIME = 1000 / FRAME_RATE; // desired frames per second

  var defaulColorScale = ["rgb(68.353024,1.247744,84.33024)","rgb(68.73856,2.45888,85.869312)","rgb(69.105664,3.744,87.393024)","rgb(69.45408,5.105152,88.900864)","rgb(69.784064,6.544128,90.391808)","rgb(70.095104,8.063232,91.866368)","rgb(70.387712,9.664512,93.323008)","rgb(70.661632,11.306752,94.761984)","rgb(70.916608,12.888064,96.18304)","rgb(71.152896,14.418944,97.584896)","rgb(71.370496,15.90912,98.967552)","rgb(71.568896,17.366016,100.330752)","rgb(71.748352,18.794752,101.673728)","rgb(71.908864,20.200192,102.996224)","rgb(72.050176,21.58592,104.297984)","rgb(72.172544,22.954496,105.57824)","rgb(72.275712,24.30848,106.836736)","rgb(72.359936,25.650176,108.07296)","rgb(72.42496,26.980608,109.286912)","rgb(72.471296,28.301568,110.477824)","rgb(72.498432,29.61408,111.64544)","rgb(72.506624,30.918912,112.789504)","rgb(72.495872,32.217088,113.90976)","rgb(72.466432,33.50912,115.005696)","rgb(72.418304,34.79552,116.077312)","rgb(72.351488,36.077056,117.124352)","rgb(72.26624,37.353472,118.14656)","rgb(72.163072,38.625536,119.14368)","rgb(72.041472,39.893504,120.115456)","rgb(71.902208,41.157376,121.062144)","rgb(71.74528,42.417408,121.983488)","rgb(71.570944,43.673344,122.879232)","rgb(71.379456,44.92544,123.749632)","rgb(71.171072,46.173952,124.594432)","rgb(70.946304,47.418368,125.413888)","rgb(70.705664,48.658944,126.208256)","rgb(70.448896,49.89568,126.97728)","rgb(70.176768,51.128576,127.721216)","rgb(69.889536,52.35712,128.440576)","rgb(69.587968,53.581568,129.135104)","rgb(69.27232,54.801664,129.805312)","rgb(68.942848,56.017408,130.451712)","rgb(68.599808,57.228544,131.074048)","rgb(68.24448,58.435072,131.673344)","rgb(67.87712,59.636736,132.249344)","rgb(67.497728,60.833536,132.803072)","rgb(67.107328,62.025216,133.334272)","rgb(66.706176,63.212032,133.843968)","rgb(66.29504,64.393472,134.332416)","rgb(65.874432,65.56928,134.800128)","rgb(65.44512,66.739968,135.247872)","rgb(65.00736,67.905024,135.675648)","rgb(64.561664,69.064448,136.084224)","rgb(64.1088,70.21824,136.474368)","rgb(63.649024,71.3664,136.846336)","rgb(63.183616,72.508672,137.200896)","rgb(62.712832,73.6448,137.53856)","rgb(62.236928,74.775552,137.860096)","rgb(61.756672,75.90016,138.165504)","rgb(61.272576,77.01888,138.456064)","rgb(60.784896,78.131712,138.731776)","rgb(60.294656,79.238912,138.993664)","rgb(59.802368,80.339968,139.241984)","rgb(59.308544,81.435136,139.477504)","rgb(58.813184,82.524416,139.700736)","rgb(58.317312,83.608064,139.912192)","rgb(57.820928,84.68608,140.112384)","rgb(57.3248,85.758464,140.301568)","rgb(56.829184,86.825216,140.480512)","rgb(56.334592,87.886592,140.649728)","rgb(55.84128,88.942592,140.809728)","rgb(55.34976,89.99296,140.960512)","rgb(54.860288,91.038464,141.103104)","rgb(54.37312,92.078848,141.23776)","rgb(53.888768,93.114112,141.364736)","rgb(53.407488,94.144512,141.4848)","rgb(52.929536,95.170048,141.597952)","rgb(52.455168,96.190976,141.704448)","rgb(51.984128,97.207296,141.8048)","rgb(51.517184,98.21952,141.899264)","rgb(51.05408,99.227392,141.988352)","rgb(50.594816,100.231168,142.072064)","rgb(50.14016,101.230848,142.150656)","rgb(49.6896,102.226688,142.22464)","rgb(49.243392,103.218944,142.294016)","rgb(48.801536,104.207616,142.358784)","rgb(48.364288,105.19296,142.419456)","rgb(47.931136,106.174976,142.476032)","rgb(47.502336,107.15392,142.528768)","rgb(47.077888,108.130048,142.577664)","rgb(46.657536,109.103104,142.62272)","rgb(46.241024,110.0736,142.664192)","rgb(45.828864,111.041536,142.70208)","rgb(45.420288,112.006912,142.73664)","rgb(45.015296,112.97024,142.76736)","rgb(44.614144,113.931264,142.794752)","rgb(44.216064,114.890496,142.81856)","rgb(43.821056,115.84768,142.83904)","rgb(43.429376,116.803072,142.85568)","rgb(43.040256,117.756928,142.868992)","rgb(42.653952,118.709248,142.878464)","rgb(42.269952,119.660288,142.884096)","rgb(41.888,120.610048,142.885888)","rgb(41.508352,121.558528,142.88384)","rgb(41.13024,122.50624,142.87744)","rgb(40.753664,123.452672,142.866688)","rgb(40.378624,124.398592,142.851328)","rgb(40.00512,125.343744,142.831616)","rgb(39.63264,126.288128,142.80704)","rgb(39.261184,127.232,142.777344)","rgb(38.891008,128.17536,142.742272)","rgb(38.521856,129.118464,142.70208)","rgb(38.153984,130.061056,142.656)","rgb(37.787392,131.003648,142.604544)","rgb(37.42208,131.945728,142.546688)","rgb(37.058304,132.887808,142.482432)","rgb(36.695808,133.829888,142.41152)","rgb(36.33536,134.771968,142.333696)","rgb(35.977216,135.713792,142.248704)","rgb(35.621632,136.655872,142.156288)","rgb(35.26912,137.597952,142.055936)","rgb(34.920448,138.540288,141.947648)","rgb(34.576896,139.482368,141.831424)","rgb(34.238208,140.42496,141.706496)","rgb(33.905664,141.367296,141.572608)","rgb(33.580032,142.310144,141.429504)","rgb(33.262848,143.252992,141.277184)","rgb(32.954624,144.19584,141.114624)","rgb(32.657408,145.138944,140.942336)","rgb(32.371968,146.082048,140.759296)","rgb(32.100864,147.025408,140.566016)","rgb(31.84512,147.968512,140.361472)","rgb(31.606528,148.911872,140.14592)","rgb(31.387136,149.854976,139.918592)","rgb(31.188736,150.79808,139.679488)","rgb(31.013888,151.741184,139.428096)","rgb(30.86464,152.684032,139.164416)","rgb(30.743552,153.626624,138.88768)","rgb(30.652928,154.56896,138.5984)","rgb(30.595072,155.510784,138.295808)","rgb(30.572288,156.452096,137.979392)","rgb(30.587648,157.393152,137.649152)","rgb(30.642944,158.33344,137.304832)","rgb(30.740736,159.273216,136.946176)","rgb(30.883328,160.211968,136.572928)","rgb(31.07328,161.149952,136.185088)","rgb(31.311872,162.087168,135.781888)","rgb(31.601664,163.023104,135.363328)","rgb(31.94368,163.958016,134.929408)","rgb(32.339456,164.891392,134.479616)","rgb(32.790272,165.823744,134.013696)","rgb(33.297152,166.754304,133.531648)","rgb(33.860608,167.683584,133.033216)","rgb(34.481152,168.610816,132.518144)","rgb(35.158784,169.536512,131.986176)","rgb(35.89376,170.459904,131.437312)","rgb(36.685568,171.381504,130.87104)","rgb(37.533696,172.3008,130.287616)","rgb(38.437888,173.217536,129.686784)","rgb(39.396864,174.131968,129.068032)","rgb(40.409856,175.04384,128.431616)","rgb(41.476096,175.952896,127.777024)","rgb(42.594048,176.859136,127.104512)","rgb(43.762688,177.762304,126.413568)","rgb(44.980992,178.6624,125.704448)","rgb(46.247168,179.558912,124.976384)","rgb(47.560448,180.452096,124.229888)","rgb(48.91904,181.341696,123.464704)","rgb(50.322176,182.227712,122.680576)","rgb(51.768064,183.109632,121.877504)","rgb(53.25568,183.987456,121.055488)","rgb(54.784,184.861184,120.214528)","rgb(56.351744,185.730304,119.353856)","rgb(57.957632,186.595328,118.473984)","rgb(59.60064,187.455232,117.574912)","rgb(61.279744,188.310528,116.656128)","rgb(62.99392,189.16096,115.718144)","rgb(64.742144,190.006016,114.760704)","rgb(66.523392,190.845952,113.783552)","rgb(68.336896,191.680256,112.786688)","rgb(70.182144,192.508928,111.769856)","rgb(72.058112,193.331968,110.733312)","rgb(73.963776,194.148864,109.677056)","rgb(75.898624,194.959616,108.601088)","rgb(77.861888,195.764224,107.505408)","rgb(79.8528,196.562432,106.390016)","rgb(81.871104,197.353984,105.254912)","rgb(83.915776,198.13888,104.09984)","rgb(85.98656,198.916608,102.924544)","rgb(88.082944,199.687424,101.729536)","rgb(90.20416,200.450816,100.514816)","rgb(92.349696,201.206784,99.280384)","rgb(94.518784,201.955328,98.025984)","rgb(96.711424,202.695936,96.752384)","rgb(98.926848,203.428864,95.458816)","rgb(101.164544,204.1536,94.145792)","rgb(103.424256,204.8704,92.813312)","rgb(105.705728,205.578496,91.460864)","rgb(108.008448,206.278144,90.08896)","rgb(110.331648,206.969088,88.697856)","rgb(112.675072,207.651328,87.287552)","rgb(115.038208,208.324608,85.858304)","rgb(117.420544,208.988928,84.410112)","rgb(119.821568,209.643776,82.943488)","rgb(122.241024,210.289664,81.45792)","rgb(124.678656,210.925824,79.954176)","rgb(127.13344,211.552256,78.432512)","rgb(129.605376,212.169216,76.892672)","rgb(132.093952,212.776448,75.335424)","rgb(134.598656,213.373696,73.760512)","rgb(137.118976,213.96096,72.168448)","rgb(139.654144,214.537984,70.560256)","rgb(142.203904,215.105024,68.935936)","rgb(144.767488,215.66208,67.296512)","rgb(147.344128,216.208896,65.64224)","rgb(149.933568,216.745216,63.973632)","rgb(152.534784,217.271552,62.292224)","rgb(155.14752,217.787648,60.598272)","rgb(157.771008,218.293504,58.893312)","rgb(160.404224,218.78912,57.178368)","rgb(163.046912,219.274752,55.45472)","rgb(165.697792,219.7504,53.724416)","rgb(168.356352,220.216064,51.988992)","rgb(171.021824,220.671744,50.251008)","rgb(173.693184,221.117952,48.512768)","rgb(176.369664,221.554688,46.7776)","rgb(179.05024,221.981952,45.048576)","rgb(181.733888,222.400256,43.329792)","rgb(184.420096,222.8096,41.626368)","rgb(187.107584,223.210496,39.943424)","rgb(189.795328,223.602944,38.287616)","rgb(192.482304,223.987456,36.666368)","rgb(195.167488,224.364544,35.088384)","rgb(197.850112,224.734208,33.563904)","rgb(200.52864,225.09696,32.10368)","rgb(203.20256,225.453568,30.72128)","rgb(205.870592,225.803776,29.43104)","rgb(208.531456,226.148608,28.248832)","rgb(211.18464,226.48832,27.191552)","rgb(213.82912,226.823424,26.277376)","rgb(216.463616,227.154432,25.523712)","rgb(219.08736,227.481856,24.947712)","rgb(221.699328,227.806208,24.563968)","rgb(224.299008,228.128,24.384)","rgb(226.885376,228.447744,24.415744)","rgb(229.45792,228.765696,24.66176)","rgb(232.015616,229.08288,25.12)","rgb(234.557952,229.399296,25.783552)","rgb(237.083136,229.71648,26.642176)","rgb(239.591424,230.03392,27.681536)","rgb(242.082816,230.35264,28.886528)","rgb(244.5568,230.67264,30.240768)","rgb(247.012864,230.994688,31.728896)","rgb(249.450752,231.31904,33.33504)","rgb(251.870208,231.645952,35.045632)","rgb(254.271488,231.976192,36.847616)"];
  var colorScale = params.colorScale || defaulColorScale;
  var NULL_WIND_VECTOR = [NaN, NaN, null]; // singleton for no wind in the form: [u, v, magnitude]

  var builder;
  var grid;
  var gridData = params.data;
  var date;
  var λ0, φ0, Δλ, Δφ, ni, nj;

  var setData = function setData(data) {
    gridData = data;
  };

  var setOptions = function setOptions(options) {
    if (options.hasOwnProperty("minVelocity")) MIN_VELOCITY_INTENSITY = options.minVelocity;
    if (options.hasOwnProperty("maxVelocity")) MAX_VELOCITY_INTENSITY = options.maxVelocity;
    if (options.hasOwnProperty("velocityScale")) VELOCITY_SCALE = (options.velocityScale || 0.005) * (Math.pow(window.devicePixelRatio, 1 / 3) || 1);
    if (options.hasOwnProperty("particleAge")) MAX_PARTICLE_AGE = options.particleAge;
    if (options.hasOwnProperty("lineWidth")) PARTICLE_LINE_WIDTH = options.lineWidth;
    if (options.hasOwnProperty("particleMultiplier")) PARTICLE_MULTIPLIER = options.particleMultiplier;
    if (options.hasOwnProperty("frameRate")) FRAME_RATE = options.frameRate;
    FRAME_TIME = 1000 / FRAME_RATE;
  }; // interpolation for vectors like wind (u,v,m)


  var bilinearInterpolateVector = function bilinearInterpolateVector(x, y, g00, g10, g01, g11) {
    var rx = 1 - x;
    var ry = 1 - y;
    var a = rx * ry,
        b = x * ry,
        c = rx * y,
        d = x * y;
    var u = g00[0] * a + g10[0] * b + g01[0] * c + g11[0] * d;
    var v = g00[1] * a + g10[1] * b + g01[1] * c + g11[1] * d;
    return [u, v, Math.sqrt(u * u + v * v)];
  };

  var createWindBuilder = function createWindBuilder(uComp, vComp) {
    var uData = uComp.data,
        vData = vComp.data;
    return {
      header: uComp.header,
      //recipe: recipeFor("wind-" + uComp.header.surface1Value),
      data: function data(i) {
        return [uData[i], vData[i]];
      },
      interpolate: bilinearInterpolateVector
    };
  };

  var createBuilder = function createBuilder(data) {
    var uComp = null,
        vComp = null,
        scalar = null;
    data.forEach(function (record) {
      switch (record.header.parameterCategory + "," + record.header.parameterNumber) {
        case "1,2":
        case "2,2":
          uComp = record;
          break;

        case "1,3":
        case "2,3":
          vComp = record;
          break;

        default:
          scalar = record;
      }
    });
    return createWindBuilder(uComp, vComp);
  };

  var buildGrid = function buildGrid(data, callback) {
    builder = createBuilder(data);
    var header = builder.header;
    λ0 = header.lo1;
    φ0 = header.la1; // the grid's origin (e.g., 0.0E, 90.0N)

    Δλ = header.dx;
    Δφ = header.dy; // distance between grid points (e.g., 2.5 deg lon, 2.5 deg lat)

    ni = header.nx;
    nj = header.ny; // number of grid points W-E and N-S (e.g., 144 x 73)

    date = new Date(header.refTime);
    date.setHours(date.getHours() + header.forecastTime); // Scan mode 0 assumed. Longitude increases from λ0, and latitude decreases from φ0.
    // http://www.nco.ncep.noaa.gov/pmb/docs/grib2/grib2_table3-4.shtml

    grid = [];
    var p = 0;
    var isContinuous = Math.floor(ni * Δλ) >= 360;

    for (var j = 0; j < nj; j++) {
      var row = [];

      for (var i = 0; i < ni; i++, p++) {
        row[i] = builder.data(p);
      }

      if (isContinuous) {
        // For wrapped grids, duplicate first column as last column to simplify interpolation logic
        row.push(row[0]);
      }

      grid[j] = row;
    }

    callback({
      date: date,
      interpolate: interpolate
    });
  };
  /**
   * Get interpolated grid value from Lon/Lat position
   * @param λ {Float} Longitude
   * @param φ {Float} Latitude
   * @returns {Object}
   */


  var interpolate = function interpolate(λ, φ) {
    if (!grid) return null;
    var i = floorMod(λ - λ0, 360) / Δλ; // calculate longitude index in wrapped range [0, 360)

    var j = (φ0 - φ) / Δφ; // calculate latitude index in direction +90 to -90

    var fi = Math.floor(i),
        ci = fi + 1;
    var fj = Math.floor(j),
        cj = fj + 1;
    var row;

    if (row = grid[fj]) {
      var g00 = row[fi];
      var g10 = row[ci];

      if (isValue(g00) && isValue(g10) && (row = grid[cj])) {
        var g01 = row[fi];
        var g11 = row[ci];

        if (isValue(g01) && isValue(g11)) {
          // All four points found, so interpolate the value.
          return builder.interpolate(i - fi, j - fj, g00, g10, g01, g11);
        }
      }
    }

    return null;
  };
  /**
   * @returns {Boolean} true if the specified value is not null and not undefined.
   */


  var isValue = function isValue(x) {
    return x !== null && x !== undefined;
  };
  /**
   * @returns {Number} returns remainder of floored division, i.e., floor(a / n). Useful for consistent modulo
   *          of negative numbers. See http://en.wikipedia.org/wiki/Modulo_operation.
   */


  var floorMod = function floorMod(a, n) {
    return a - n * Math.floor(a / n);
  };
  /**
   * @returns {Number} the value x clamped to the range [low, high].
   */


  var clamp = function clamp(x, range) {
    return Math.max(range[0], Math.min(x, range[1]));
  };
  /**
   * @returns {Boolean} true if agent is probably a mobile device. Don't really care if this is accurate.
   */


  var isMobile = function isMobile() {
    return /android|blackberry|iemobile|ipad|iphone|ipod|opera mini|webos/i.test(navigator.userAgent);
  };
  /**
   * Calculate distortion of the wind vector caused by the shape of the projection at point (x, y). The wind
   * vector is modified in place and returned by this function.
   */


  var distort = function distort(projection, λ, φ, x, y, scale, wind, windy) {
    var u = wind[0] * scale;
    var v = wind[1] * scale;
    var d = distortion(projection, λ, φ, x, y, windy); // Scale distortion vectors by u and v, then add.

    wind[0] = d[0] * u + d[2] * v;
    wind[1] = d[1] * u + d[3] * v;
    return wind;
  };

  var distortion = function distortion(projection, λ, φ, x, y, windy) {
    var τ = 2 * Math.PI;
    var H = Math.pow(10, -5.2);
    var hλ = λ < 0 ? H : -H;
    var hφ = φ < 0 ? H : -H;
    var pλ = project(φ, λ + hλ, windy);
    var pφ = project(φ + hφ, λ, windy); // Meridian scale factor (see Snyder, equation 4-3), where R = 1. This handles issue where length of 1º λ
    // changes depending on φ. Without this, there is a pinching effect at the poles.

    var k = Math.cos(φ / 360 * τ);
    return [(pλ[0] - x) / hλ / k, (pλ[1] - y) / hλ / k, (pφ[0] - x) / hφ, (pφ[1] - y) / hφ];
  };

  var createField = function createField(columns, bounds, callback) {
    /**
     * @returns {Array} wind vector [u, v, magnitude] at the point (x, y), or [NaN, NaN, null] if wind
     *          is undefined at that point.
     */
    function field(x, y) {
      var column = columns[Math.round(x)];
      return column && column[Math.round(y)] || NULL_WIND_VECTOR;
    } // Frees the massive "columns" array for GC. Without this, the array is leaked (in Chrome) each time a new
    // field is interpolated because the field closure's context is leaked, for reasons that defy explanation.


    field.release = function () {
      columns = [];
    };

    field.randomize = function (o) {
      // UNDONE: this method is terrible
      var x, y;
      var safetyNet = 0;

      do {
        x = Math.round(Math.floor(Math.random() * bounds.width) + bounds.x);
        y = Math.round(Math.floor(Math.random() * bounds.height) + bounds.y);
      } while (field(x, y)[2] === null && safetyNet++ < 30);

      o.x = x;
      o.y = y;
      return o;
    };

    callback(bounds, field);
  };

  var buildBounds = function buildBounds(bounds, width, height) {
    var upperLeft = bounds[0];
    var lowerRight = bounds[1];
    var x = Math.round(upperLeft[0]); //Math.max(Math.floor(upperLeft[0], 0), 0);

    var y = Math.max(Math.floor(upperLeft[1], 0), 0);
    var xMax = Math.min(Math.ceil(lowerRight[0], width), width - 1);
    var yMax = Math.min(Math.ceil(lowerRight[1], height), height - 1);
    return {
      x: x,
      y: y,
      xMax: width,
      yMax: yMax,
      width: width,
      height: height
    };
  };

  var deg2rad = function deg2rad(deg) {
    return deg / 180 * Math.PI;
  };

  var rad2deg = function rad2deg(ang) {
    return ang / (Math.PI / 180.0);
  };

  var invert = function invert(x, y, windy) {
    var mapLonDelta = windy.east - windy.west;
    var worldMapRadius = windy.width / rad2deg(mapLonDelta) * 360 / (2 * Math.PI);
    var mapOffsetY = worldMapRadius / 2 * Math.log((1 + Math.sin(windy.south)) / (1 - Math.sin(windy.south)));
    var equatorY = windy.height + mapOffsetY;
    var a = (equatorY - y) / worldMapRadius;
    var lat = 180 / Math.PI * (2 * Math.atan(Math.exp(a)) - Math.PI / 2);
    var lon = rad2deg(windy.west) + x / windy.width * rad2deg(mapLonDelta);
    return [lon, lat];
  };

  var mercY = function mercY(lat) {
    return Math.log(Math.tan(lat / 2 + Math.PI / 4));
  };

  var project = function project(lat, lon, windy) {
    // both in radians, use deg2rad if neccessary
    var ymin = mercY(windy.south);
    var ymax = mercY(windy.north);
    var xFactor = windy.width / (windy.east - windy.west);
    var yFactor = windy.height / (ymax - ymin);
    var y = mercY(deg2rad(lat));
    var x = (deg2rad(lon) - windy.west) * xFactor;
    var y = (ymax - y) * yFactor; // y points south

    return [x, y];
  };

  var interpolateField = function interpolateField(grid, bounds, extent, callback) {
    var projection = {};
    var mapArea = (extent.south - extent.north) * (extent.west - extent.east);
    var velocityScale = VELOCITY_SCALE * Math.pow(mapArea, 0.4);
    var columns = [];
    var x = bounds.x;

    function interpolateColumn(x) {
      var column = [];

      for (var y = bounds.y; y <= bounds.yMax; y += 2) {
        var coord = invert(x, y, extent);

        if (coord) {
          var λ = coord[0],
              φ = coord[1];

          if (isFinite(λ)) {
            var wind = grid.interpolate(λ, φ);

            if (wind) {
              wind = distort(projection, λ, φ, x, y, velocityScale, wind, extent);
              column[y + 1] = column[y] = wind;
            }
          }
        }
      }

      columns[x + 1] = columns[x] = column;
    }

    (function batchInterpolate() {
      var start = Date.now();

      while (x < bounds.width) {
        interpolateColumn(x);
        x += 2;

        if (Date.now() - start > 1000) {
          //MAX_TASK_TIME) {
          setTimeout(batchInterpolate, 25);
          return;
        }
      }

      createField(columns, bounds, callback);
    })();
  };

  var animationLoop;

  var animate = function animate(bounds, field) {
    function windIntensityColorScale(min, max) {
      colorScale.indexFor = function (m) {
        // map velocity speed to a style
        return Math.max(0, Math.min(colorScale.length - 1, Math.round((m - min) / (max - min) * (colorScale.length - 1))));
      };

      return colorScale;
    }

    var colorStyles = windIntensityColorScale(MIN_VELOCITY_INTENSITY, MAX_VELOCITY_INTENSITY);
    var buckets = colorStyles.map(function () {
      return [];
    });
    var particleCount = Math.round(bounds.width * bounds.height * PARTICLE_MULTIPLIER);

    if (isMobile()) {
      particleCount *= PARTICLE_REDUCTION;
    }

    var fadeFillStyle = "rgba(0, 0, 0, 0.97)";
    var particles = [];

    for (var i = 0; i < particleCount; i++) {
      particles.push(field.randomize({
        age: Math.floor(Math.random() * MAX_PARTICLE_AGE) + 0
      }));
    }

    function evolve() {
      buckets.forEach(function (bucket) {
        bucket.length = 0;
      });
      particles.forEach(function (particle) {
        if (particle.age > MAX_PARTICLE_AGE) {
          field.randomize(particle).age = 0;
        }

        var x = particle.x;
        var y = particle.y;
        var v = field(x, y); // vector at current position

        var m = v[2];

        if (m === null) {
          particle.age = MAX_PARTICLE_AGE; // particle has escaped the grid, never to return...
        } else {
          var xt = x + v[0];
          var yt = y + v[1];

          if (field(xt, yt)[2] !== null) {
            // Path from (x,y) to (xt,yt) is visible, so add this particle to the appropriate draw bucket.
            particle.xt = xt;
            particle.yt = yt;
            buckets[colorStyles.indexFor(m)].push(particle);
          } else {
            // Particle isn't visible, but it still moves through the field.
            particle.x = xt;
            particle.y = yt;
          }
        }

        particle.age += 1;
      });
    }

    var g = params.canvas.getContext("2d");
    g.lineWidth = PARTICLE_LINE_WIDTH;
    g.fillStyle = fadeFillStyle;
    g.globalAlpha = 0.6;

    function draw() {
      // Fade existing particle trails.
      var prev = "lighter";
      g.globalCompositeOperation = "destination-in";
      g.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
      g.globalCompositeOperation = prev;
      g.globalAlpha = 0.9; // Draw new particle trails.

      buckets.forEach(function (bucket, i) {
        if (bucket.length > 0) {
          g.beginPath();
          g.strokeStyle = colorStyles[i];
          bucket.forEach(function (particle) {
            g.moveTo(particle.x, particle.y);
            g.lineTo(particle.xt, particle.yt);
            particle.x = particle.xt;
            particle.y = particle.yt;
          });
          g.stroke();
        }
      });
    }

    var then = Date.now();

    (function frame() {
      animationLoop = requestAnimationFrame(frame);
      var now = Date.now();
      var delta = now - then;

      if (delta > FRAME_TIME) {
        then = now - delta % FRAME_TIME;
        evolve();
        draw();
      }
    })();
  };

  var start = function start(bounds, width, height, extent) {
    var mapBounds = {
      south: deg2rad(extent[0][1]),
      north: deg2rad(extent[1][1]),
      east: deg2rad(extent[1][0]),
      west: deg2rad(extent[0][0]),
      width: width,
      height: height
    };
    stop(); // build grid

    buildGrid(gridData, function (grid) {
      // interpolateField
      interpolateField(grid, buildBounds(bounds, width, height), mapBounds, function (bounds, field) {
        // animate the canvas with random points
        windy.field = field;
        animate(bounds, field);
      });
    });
  };

  var stop = function stop() {
    if (windy.field) windy.field.release();
    if (animationLoop) cancelAnimationFrame(animationLoop);
  };

  var windy = {
    params: params,
    start: start,
    stop: stop,
    createField: createField,
    interpolatePoint: interpolate,
    setData: setData,
    setOptions: setOptions
  };
  return windy;
};

if (!window.cancelAnimationFrame) {
  window.cancelAnimationFrame = function (id) {
    clearTimeout(id);
  };
}