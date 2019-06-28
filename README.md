# NEPHELAE : Network for studying Entrainment and microPHysics of cLouds using Adaptive Exploration

## TODO

- dimensions of map in km cross sections ?
- maps : https://leaflet-extras.github.io/leaflet-providers/preview/ / mobile atlas creator, create script ?
- drone icon : https://www.iconfinder.com/editor/?id=322416&size=512&hash=35e99f72b6a7fe901ef630ae0ef71ac68a9e7efcdc24e720b4cd5d2a
- start info page
- cross section dropdown
- os.environ['MESO_NH'], os.environ['MAP_TILES'] -> define env variables in install script
- ngrok for fast global serving
- leaflet realtime plugin ? (webgl) heatmaps ? Leaflet.heat ? zoomhome, fullscreen ? leaflet-velocity
- implement general method for cross section with variable name parameter
- plotly update button


## Benchmark

- display cross section : 400ms, mostly due to base64 image encoding, have to try get images -> as long ...

## Install

MesoNH correct path data (MesoNH/MesoNH.nc) -> will solve later with env variables
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
