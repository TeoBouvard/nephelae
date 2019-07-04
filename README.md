# NEPHELAE : Network for studying Entrainment and microPHysics of cLouds using Adaptive Exploration

## Documentation

Q : What is this ?
A : This is a web application designed as an interface between a fleet of UAV frome the Nephelae project and Météo-France users. It comprises various tools to help them visualize the data being acquired from the drones.

Q : How do I install it ?
A : Just download install.sh, place it in an empty folder and run it. It creates a Python virutal environnement to install dependencies, so it wont mess up your packages. You shloud define three environment variables for this to work :
    - $MAP_TILES referencing a map atlas. If you plan to use it with an internet connection, you can skip this step and change the tileLayer URL in web/nephelae/static/map.js
    - $MESO_NH referencing the Meso_NH.nc file.
    - $PAPARAZZI_HOME referencing the root folder of Paparazzi (see https://wiki.paparazziuav.org/wiki/Installation).


Q : How do I run it ?
A : Once installed, you should run a paparazzi simulation (see paparazziuav wiki), and launch the server by running runserver.sh. You should then open a web browser (chrome preferably) and go to localhost:8000.


Q : How does it work ?
A : This webapp is based on a client-server architecture. When the client requests a web page, the requested URL is compared to every entry in the web/URL.py file. If it matches one entry, the corresponding view (web/nepeheale/views) is called. A view can call model methods (web/nephelae/models), where the logic is located. The view then returns a response containing the data requested. HTTP responses are sent back by the server to the client, where it is handled by scipts (web/nephelae/static/js) and displayed according to stylesheets (web/nephelae/static/css) and templates (web/nephelae/templates).


Q : How can I tune it ?
A : Most of the display tuning is located at the top of the javascript files : refresh rate, initial trail length ... You can change these parameters and reload the pages to see it in action. When doing so, make sure to disable browser caching, or the scripts won't be requested to the server but taken from the cache.


Q : I updated the views/models but nothing changes, what is happening ?
A : For updates concerning server-side programming files to take place, you have to restart the server. You can ctrl-c twice, and re-run runserver.sh. Note that this is not necessary when updating client-side programming files (js, css, html files), as long as browser caching is disabled.


Q : I do not have a Meso_NH.nc file, what can I do ?
A : You can reference any *.nc file with your $MESO_NH environment variable, and it will *work*. The original file is 70GB so it did not fit in a commit, sorry.



## TODO

- maps : https://leaflet-extras.github.io/leaflet-providers/preview/ / mobile atlas creator, create script ?
- cross section dropdown
- os.environ['MESO_NH'], os.environ['MAP_TILES'] -> define env variables in install script !
- ngrok for fast global serving
- leaflet/plotly fullscreen ? leaflet-velocity
- plotly update button
- requête repère mobile au mapping
- requête box au mapping
- map legend ?
- drag problem in 3d -> three.js instead of plot ?
- frontend (bootstrap or more lightweight)

## Install

- ./install.sh

## Infos from users

-Infos (passé, présent, futur)
    - Nuage ()
    - Flotte
    - Infos générales
        - Wind (U)
        - Temps (t)
        - Gradients verticaux
        - Lift condensation level

- Destinataires
    - Metéo
    - Algos
    - Dronistes

- Instructions
    - Meteo
    - Algos


## Questions

-   authentication ?
-   approximate mesh from points cloud -> big points sufficient ?

## Ideas

-   3D global view :

    -   axes (cardinal + height + time)
    -   drones + trails + infos?
    -   clouds (lwc > 0)
    -   sélection plan de coupe

-   Vues en coupe :

    -   horizontale (altitude)
    -   verticale (vecteur normal)

-   Tracking drones :

    -   map with drones + trails + intentions
    -   altitude/time graph

-   Mesures

    -   emagrammes
    -   infos drones

## 3D preview

-   Cesium (ok mais fort couplage maps)
-   I3S bof
-   Flyvast (\$\$)
-   three.js (pas mal, doc++)
-   Potree (open source, doc--, win--)
-   PPTK (simple à mettre en place, pas beaucoup de possibilités)
-   Chart.js
