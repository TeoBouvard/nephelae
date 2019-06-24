# nephelae

## TODO

- assertion failed when idle and action
- assertion failed: (pxp->bf_offset <= offset && offset < pxp->bf_offset + (off_t) pxp->bf_extent), function px_rel, file posixio.c, line 449. -> instance every time ? no
- dimensions of map in km cross sections ?
- collect requirements and dependencies ! -> pip install -r requirements.txt -> try with virtual env
- dissociate views
- maps : https://leaflet-extras.github.io/leaflet-providers/preview/
- drone icon : https://www.iconfinder.com/editor/?id=322416&size=512&hash=35e99f72b6a7fe901ef630ae0ef71ac68a9e7efcdc24e720b4cd5d2a
- start info page
- plotly or chart.js ?
- cross section dropdown

## Benchmark

- display cross section : 400ms, mostly due to base64 image encoding

## Questions

-   authentication ?
-   approximate mesh from points cloud -> big points sufficient ?
-   csrf token to prevent Cross Site Request

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
