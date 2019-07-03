# NEPHELAE : Network for studying Entrainment and microPHysics of cLouds using Adaptive Exploration

## TODO

- maps : https://leaflet-extras.github.io/leaflet-providers/preview/ / mobile atlas creator, create script ?
- start info page
- cross section dropdown
- os.environ['MESO_NH'], os.environ['MAP_TILES'] -> define env variables in install script !
- ngrok for fast global serving
- leaflet/plotly fullscreen ? leaflet-velocity
- plotly update button
- requête repère mobile au mapping
- requête box au mapping
- map legend ?
- drag problem in 3d

## Benchmark

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
