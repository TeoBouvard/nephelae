
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
            zoomInText: '+',
            zoomInTitle: 'Zoom in',
            zoomOutText: '-',
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