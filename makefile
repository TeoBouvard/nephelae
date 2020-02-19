ECHO = @echo
FETCH = @curl --silent
SHELL:=/bin/bash

pip_options=
install_mode=user
install_pprzlink=False
DATABASE=$(PWD)/demo/demo_db.neph

# Getting this file location
mkfile_path:=$(abspath $(lastword $(MAKEFILE_LIST)))
current_dir:=$(dir $(mkfile_path))

# Find a way to tell the user default config is used
ifndef NEPHELAE_CONFIG
export NEPHELAE_CONFIG:=$(current_dir)config/examples/test05.yaml
endif

.PHONY: demo runserver install assets requirements paparazzi

help:
	$(ECHO) "- help		: Display this message"
	$(ECHO) "- runserver	: Run server"
	$(ECHO) "- install	: Donwload external assets and Python packages"
	$(ECHO) "- clean-maps	: Delete all downloaded maps"
	$(ECHO) "- clean-assets	: Delete external assets"
	$(ECHO) "- simulation	: Launch paparazzi simulation"
	$(ECHO) $(mkfile_path)
	$(ECHO) $(current_dir)


install : assets requirements paparazzi

assets :
	$(ECHO) -n "Creating static folders ... "
	@mkdir -p web/nephelae_gui/static/js/libs web/nephelae_gui/static/css/libs/images web/nephelae_gui/static/map_tiles web/nephelae_gui/static/css/libs/icons
	$(ECHO) "OK"

	$(ECHO) -n "Downloading javascript libraries ... "
	$(FETCH) --output web/nephelae_gui/static/js/libs/jquery.js 'https://code.jquery.com/jquery-3.4.1.min.js'
	$(FETCH) --output web/nephelae_gui/static/js/libs/cookies.js 'https://cdn.jsdelivr.net/npm/js-cookie@2/src/js.cookie.min.js'
	$(FETCH) --output web/nephelae_gui/static/js/libs/jqueryUI.js 'https://code.jquery.com/ui/1.12.1/jquery-ui.js'
	$(FETCH) --output web/nephelae_gui/static/js/libs/dat.gui.js 'https://raw.githubusercontent.com/dataarts/dat.gui/master/build/dat.gui.min.js'
	$(FETCH) --output web/nephelae_gui/static/js/libs/leaflet.js 'https://unpkg.com/leaflet@1.5.1/dist/leaflet.js'
	$(FETCH) --output web/nephelae_gui/static/js/libs/leafletRotatedMarker.js 'https://raw.githubusercontent.com/bbecquet/Leaflet.RotatedMarker/master/leaflet.rotatedMarker.js'
	$(FETCH) --output web/nephelae_gui/static/js/libs/materialize.js 'https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/js/materialize.min.js'
	$(FETCH) --output web/nephelae_gui/static/js/libs/three.js 'https://cdnjs.cloudflare.com/ajax/libs/three.js/107/three.min.js'
	$(FETCH) --output web/nephelae_gui/static/js/libs/OrbitControls.js 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/js/controls/OrbitControls.js'
	$(FETCH) --output web/nephelae_gui/static/js/libs/GLTFLoader.js 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/js/loaders/GLTFLoader.js'
	$(FETCH) --output web/nephelae_gui/static/js/libs/plotly.js 'https://cdn.plot.ly/plotly-latest.min.js'
	$(FETCH) --output web/nephelae_gui/static/js/libs/cytoscape.min.js 'https://raw.githubusercontent.com/cytoscape/cytoscape.js/unstable/dist/cytoscape.min.js'

	$(FETCH) --output web/nephelae_gui/static/js/libs/googleCharts.js 'https://www.gstatic.com/charts/46.2/js/jsapi_compiled_format_module.js'
	$(FETCH) 'https://www.gstatic.com/charts/46.2/js/jsapi_compiled_default_module.js' >> web/nephelae_gui/static/js/libs/googleCharts.js
	$(FETCH) 'https://www.gstatic.com/charts/46.2/js/jsapi_compiled_ui_module.js' >> web/nephelae_gui/static/js/libs/googleCharts.js
	$(FETCH) 'https://www.gstatic.com/charts/46.2/js/jsapi_compiled_fw_module.js' >> web/nephelae_gui/static/js/libs/googleCharts.js
	$(FETCH) 'https://www.gstatic.com/charts/46.2/third_party/dygraphs/dygraph-tickers-combined.js' >> web/nephelae_gui/static/js/libs/googleCharts.js
	$(FETCH) 'https://www.gstatic.com/charts/46.2/js/jsapi_compiled_timeline_module.js' >> web/nephelae_gui/static/js/libs/googleCharts.js
	$(ECHO) "OK"

# @if [ -d "apexcharts" ]; then \
# 	git -C apexcharts pull; \
# else \
# 	git clone http://github.com/apexcharts/apexcharts.js.git apexcharts; \
# fi
# @if [ ! -d "web/nephelae_gui/static/js/libs/apexcharts" ]; then \
# 	mkdir web/nephelae_gui/static/js/libs/apexcharts; \
# fi
# @cp -r apexcharts/src/* web/nephelae_gui/static/js/libs/apexcharts/
# @rm -rf apexcharts

# $(FETCH) --output web/nephelae_gui/static/js/libs/svg.filter.js 'https://raw.githubusercontent.com/svgdotjs/svg.filter.js/master/src/svg.filter.js'
# $(FETCH) --output web/nephelae_gui/static/js/libs/svg.pathmorphing.js 'https://raw.githubusercontent.com/svgdotjs/svg.pathmorphing.js/master/src/svg.pathmorphing.js'
# $(FETCH) --output web/nephelae_gui/static/js/libs/svg.draggable.js 'https://raw.githubusercontent.com/svgdotjs/svg.draggable.js/master/src/svg.draggable.js'
# $(FETCH) --output web/nephelae_gui/static/js/libs/svg.resize.js 'https://github.com/svgdotjs/svg.resize.js/blob/master/src/svg.resize.js'
# $(FETCH) --output web/nephelae_gui/static/js/libs/svg.select.js 'https://raw.githubusercontent.com/svgdotjs/svg.select.js/master/src/svg.select.js'
# $(FETCH) --output web/nephelae_gui/static/css/libs/svg.select.js 'https://raw.githubusercontent.com/svgdotjs/svg.select.js/master/src/svg.select.css'

# @if [ -d "svg_js" ]; then \
# 	git -C svg_js pull; \
# else \
# 	git clone http://github.com/svgdotjs/svg.js.git  svg_js; \
# fi
# @if [ ! -d "web/nephelae_gui/static/js/libs/svg_js" ]; then \
# 	mkdir web/nephelae_gui/static/js/libs/svg_js; \
# fi
# @cp -r svg_js/src/* web/nephelae_gui/static/js/libs/svg_js/
# @rm -rf svg_js


	$(ECHO) -n "Downloading css files ... "
	$(FETCH) --output web/nephelae_gui/static/css/libs/leaflet.css 'https://unpkg.com/leaflet@1.5.1/dist/leaflet.css'
	$(FETCH) --output web/nephelae_gui/static/css/libs/materialize.css 'https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css'
	$(FETCH) --output web/nephelae_gui/static/css/libs/material-icons.css 'https://fonts.googleapis.com/icon?family=Material+Icons'
	$(ECHO) "OK"

	$(ECHO) -n "Downloading images ... "
	$(FETCH) --output web/nephelae_gui/static/css/libs/images/layers.png 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.5.1/images/layers.png'
	$(FETCH) --output web/nephelae_gui/static/css/libs/images/marker-icon.png 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.5.1/images/marker-icon.png'
	$(FETCH) --output web/nephelae_gui/static/css/libs/images/marker-shadow.png 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.5.1/images/marker-shadow.png'
	$(ECHO) "OK"

	$(ECHO) -n "Downloading icons ... "
	$(FETCH) --output web/nephelae_gui/static/css/libs/icons/MaterialIcons-Regular.ttf 'https://raw.githubusercontent.com/google/material-design-icons/master/iconfont/MaterialIcons-Regular.ttf'
	$(ECHO) "OK"

	$(ECHO) -n "Downloading fonts ... "
	$(FETCH) --output web/nephelae_gui/static/css/libs/icons/MaterialIcons-Regular.ttf 'https://raw.githubusercontent.com/google/material-design-icons/master/iconfont/MaterialIcons-Regular.ttf'
	$(ECHO) "OK"

	$(ECHO) -n "Tuning libraries ... "
	@sed -i 's/Open Controls/Open Controls (H to hide)/g' web/nephelae_gui/static/js/libs/dat.gui.js
	@sed -i 's/Close Controls/Close Controls (H to hide)/g' web/nephelae_gui/static/js/libs/dat.gui.js
	@sed -i 's/src.*/src:url("icons\/MaterialIcons-Regular.ttf") format("truetype");/g' web/nephelae_gui/static/css/libs/material-icons.css
	$(ECHO) "OK"


requirements :
	$(ECHO) -n "Installing requirements ... "
	
	@pip3 install $(pip_options) --upgrade pip
	@pip3 install $(pip_options) wheel
	@pip3 install $(pip_options) -r requirements.txt

ifeq ($(install_mode), user)
	@if [ -d "nephelae_base" ]; then \
		git -C nephelae_base pull; \
	else \
		git clone git://redmine.laas.fr/laas/users/simon/nephelae/nephelae-devel/nephelae_base.git nephelae_base; \
	fi
	@if [ -d "nephelae_mesonh" ]; then \
		git -C nephelae_mesonh pull; \
	else \
		git clone git://redmine.laas.fr/laas/users/simon/nephelae/nephelae-devel/nephelae_mesonh.git nephelae_mesonh; \
	fi
	@if [ -d "nephelae_paparazzi" ]; then \
		git -C nephelae_paparazzi pull; \
	else \
		git clone git://redmine.laas.fr/laas/users/simon/nephelae/nephelae-devel/nephelae_paparazzi.git nephelae_paparazzi; \
	fi

	@pip3 install $(pip_options) ./nephelae_base
	@pip3 install $(pip_options) ./nephelae_mesonh
	@pip3 install $(pip_options) ./nephelae_paparazzi
	@rm -rf ./nephelae_base ./nephelae_mesonh ./nephelae_paparazzi
endif

paparazzi :
ifndef PAPARAZZI_HOME
	@echo ""
	@echo "The environment variable PAPARAZZI_HOME is not defined in your environment."
	@echo "This usually indicates that Paparazzi is not installed."
	@echo "Would you like to download a copy ? (This won't install anything on your system. If you are unsure, the answer is probably yes) [Y/n]"
	@read -sr -n1 answer && \
	if [ "$$answer" == "Y" ] || [ "$$answer" == "y" ]; then \
		if [ -d "paparazzi" ]; then \
			git -C paparazzi pull; \
		else \
			git clone -b laas_master https://github.com/pnarvor/paparazzi.git paparazzi; \
		fi && \
		echo "" && \
		echo "" && \
		echo "A copy of Paparazzi was cloned in $$(pwd)." && \
		echo "Don't forget to add these two lines to your ~/.bashrc file" && \
		echo "export PAPARAZZI_HOME=$$(pwd)/paparazzi" && \
		echo "export PAPARAZZI_SRC=$$(pwd)/paparazzi"; \
	elif [ "$$answer" == "n" ]; then \
		echo "" && \
		echo "" && \
		echo "WARNING : You chose not to download a copy of paparazzi." && \
		echo "Please note that a copy of Paparazzi pointed by the PAPARAZZI_HOME environment variable is mandatory for this software to run." && \
		echo "(Paparazzi does not have to be installed or build. Only the pprzlink python package provided with paparazzi is needed.)"; \
	else \
		echo "" && \
		echo "" && \
		echo "ERROR : You typed \"$$answer\". I did not understand. Please try again by typing \"make paparazzi\""; \
	fi
endif

# ifeq ($(install_pprzlink), true)
# 	@if [ -d "pprzlink" ]; then \
# 		git -C pprzlink pull; \
# 	else \
# 		git clone https://github.com/paparazzi/pprzlink.git pprzlink; \
# 	fi
# 
# 	@echo "You requested a standalone pprzlink installation. Please set the environment variable PAPARAZZI_PPRZLINK=$$(pwd)/pprzlink"
# endif

clean-maps :
	@rm -rf web/nephelae_gui/static/map_tiles/*

clean-assets :
	@rm -rf web/nephelae_gui/static/js/libs web/nephelae_gui/static/css/libs/images web/nephelae_gui/static/map_tiles web/nephelae_gui/static/css/libs/icons


runserver:
	$(ECHO) "Starting server ..."

#dev server (easy to kill, reloads on file changes, used in demo)
	@-cd web && python3 manage.py runserver 0.0.0.0:8000

#prod server (hard to kill, doesn't reload)
	# -@cd ./web && daphne -b 0.0.0.0 -p 8000 --access-log /dev/null IHM.asgi:application


demo: check-config
	-@export PPRZ_DB=$(DATABASE) && cd web/ && python3 manage.py runserver 0.0.0.0:8000


simulation: check-pprz
	@$(PAPARAZZI_HOME)/sw/simulator/pprzsim-launch -b 127.255.255.255 -a Microjet_neph_0 -t sim --boot --norc &
	@$(PAPARAZZI_HOME)/sw/simulator/pprzsim-launch -b 127.255.255.255 -a Microjet_neph_1 -t sim --boot --norc &
	@$(PAPARAZZI_HOME)/sw/simulator/pprzsim-launch -b 127.255.255.255 -a Microjet_neph_2 -t sim --boot --norc &
	@$(PAPARAZZI_HOME)/sw/simulator/pprzsim-launch -b 127.255.255.255 -a Microjet_neph_3 -t sim --boot --norc &
	@$(PAPARAZZI_HOME)/sw/ground_segment/cockpit/gcs -layout large_left_col.xml &
	@$(PAPARAZZI_HOME)/sw/ground_segment/tmtc/server -n


check-meso:
ifndef MESO_NH
	$(error MESO_NH is not defined)
endif


check-pprz:
ifndef PAPARAZZI_HOME
	$(error PAPARAZZI_HOME is not defined)
endif

# fix a dependency issue in pptk (Ubuntu 18.04)
#mv venv/lib/python3.6/site-packages/pptk/libs/libz.so.1 venv/lib/python3.6/site-packages/pptk/libs/libz.so.1.old
#sudo ln --silent  /lib/x86_64-linux-gnu/libz.so.1 venv/lib/python3.6/site-packages/pptk/libs/
