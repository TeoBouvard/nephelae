#!/bin/bash

# Create static folders
mkdir web/nephelae/static/js/libs web/nephelae/static/css/libs/images web/nephelae/static/map_tiles -p

# Download javascript libraries
wget -O web/nephelae/static/js/libs/jquery.js https://code.jquery.com/jquery-3.4.1.min.js
wget -O web/nephelae/static/js/libs/leaflet.js https://unpkg.com/leaflet@1.5.1/dist/leaflet.js
wget -O web/nephelae/static/js/libs/leafletRotatedMarker.js https://raw.githubusercontent.com/bbecquet/Leaflet.RotatedMarker/master/leaflet.rotatedMarker.js
wget -O web/nephelae/static/js/libs/materialize.js https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/js/materialize.min.js
wget -O web/nephelae/static/js/libs/OrbitControls.js https://raw.githubusercontent.com/mrdoob/three.js/master/examples/js/controls/OrbitControls.js
wget -O web/nephelae/static/js/libs/plotly.js https://cdn.plot.ly/plotly-latest.min.js
wget -O web/nephelae/static/js/libs/three.js https://cdnjs.cloudflare.com/ajax/libs/three.js/106/three.min.js

# Download css files
wget -O web/nephelae/static/css/libs/leaflet.css https://unpkg.com/leaflet@1.5.1/dist/leaflet.css
wget -O web/nephelae/static/css/libs/materialize.css https://cdnjs.cloudflare.com/ajax/libs/materialize/1.0.0/css/materialize.min.css

# Download images
wget -O web/nephelae/static/css/libs/images/layers.png https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.5.1/images/layers.png

apt-get -y install python3-pip

pip3 install wheel
pip3 install -r requirements.txt

# fix a dependency issue in pptk (Ubuntu 18.04)
#mv venv/lib/python3.6/site-packages/pptk/libs/libz.so.1 venv/lib/python3.6/site-packages/pptk/libs/libz.so.1.old
#sudo ln -s /lib/x86_64-linux-gnu/libz.so.1 venv/lib/python3.6/site-packages/pptk/libs/