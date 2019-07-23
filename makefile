install: assets requirements

assets : 
	@echo -n "Creating static folders ... "
	@mkdir web/nephelae/static/js/libs web/nephelae/static/css/libs/images web/nephelae/static/map_tiles web/nephelae/static/css/libs/icons -p
	@echo "OK"

	@echo -n "Downloading javascript libraries ... "
	@curl --silent --output web/nephelae/static/js/libs/jquery.js 'https://code.jquery.com/jquery-3.4.1.min.js'
	@curl --silent --output web/nephelae/static/js/libs/jqueryUI.js 'https://code.jquery.com/ui/1.12.1/jquery-ui.js'
	@curl --silent --output web/nephelae/static/js/libs/dat.gui.js 'https://raw.githubusercontent.com/dataarts/dat.gui/master/build/dat.gui.min.js'
	@curl --silent --output web/nephelae/static/js/libs/leaflet.js 'https://unpkg.com/leaflet@1.5.1/dist/leaflet.js'
	@curl --silent --output web/nephelae/static/js/libs/leafletRotatedMarker.js 'https://raw.githubusercontent.com/bbecquet/Leaflet.RotatedMarker/master/leaflet.rotatedMarker.js'
	@curl --silent --output web/nephelae/static/js/libs/materialize.js 'https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/js/materialize.min.js'
	@curl --silent --output web/nephelae/static/js/libs/three.js 'https://cdnjs.cloudflare.com/ajax/libs/three.js/106/three.min.js'
	@curl --silent --output web/nephelae/static/js/libs/OrbitControls.js 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/js/controls/OrbitControls.js'
	@curl --silent --output web/nephelae/static/js/libs/GLTFLoader.js 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/js/loaders/GLTFLoader.js'
	@curl --silent --output web/nephelae/static/js/libs/plotly.js 'https://cdn.plot.ly/plotly-latest.min.js'
	@echo "OK"

	@echo -n "Downloading css files ... "
	@curl --silent --output web/nephelae/static/css/libs/leaflet.css 'https://unpkg.com/leaflet@1.5.1/dist/leaflet.css'
	@curl --silent --output web/nephelae/static/css/libs/materialize.css 'https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css'
	@curl --silent --output web/nephelae/static/css/libs/material-icons.css 'https://fonts.googleapis.com/icon?family=Material+Icons'
	@echo "OK"

	@echo -n "Downloading images ... "
	@curl --silent --output web/nephelae/static/css/libs/images/layers.png 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.5.1/images/layers.png'
	@echo "OK"

	@echo -n "Downloading icons ... "
	@curl --silent --output web/nephelae/static/css/libs/icons/MaterialIcons-Regular.ttf 'https://raw.githubusercontent.com/google/material-design-icons/master/iconfont/MaterialIcons-Regular.ttf'
	@echo "OK"

	@echo -n "Downloading fonts ... "
	@curl --silent --output web/nephelae/static/css/libs/icons/MaterialIcons-Regular.ttf 'https://raw.githubusercontent.com/google/material-design-icons/master/iconfont/MaterialIcons-Regular.ttf'
	@echo "OK"

	@echo -n "Tuning libraries ... "
	@sed -i 's/Open Controls/Open Controls (H to hide)/g' web/nephelae/static/js/libs/dat.gui.js
	@sed -i 's/Close Controls/Close Controls (H to hide)/g' web/nephelae/static/js/libs/dat.gui.js
	@sed -i 's/src.*/src:url("icons\/MaterialIcons-Regular.ttf") format("truetype");/g' web/nephelae/static/css/libs/material-icons.css
	@echo "OK"

requirements : 
	@echo -n "Installing requirements ... "
	@apt-get -y install python3-pip

	@pip3 install wheel
	@pip3 install -r requirements.txt


purge_maps :
	@rm -rf web/nephelae/static/map_tiles/*

# fix a dependency issue in pptk (Ubuntu 18.04)
#mv venv/lib/python3.6/site-packages/pptk/libs/libz.so.1 venv/lib/python3.6/site-packages/pptk/libs/libz.so.1.old
#sudo ln --silent  /lib/x86_64-linux-gnu/libz.so.1 venv/lib/python3.6/site-packages/pptk/libs/