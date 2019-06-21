# nephelae

## TODO

- assertion failed when idle and action
- Assertion failed: (pxp->bf_offset <= offset && offset < pxp->bf_offset + (off_t) pxp->bf_extent), function px_rel, file posixio.c, line 449. -> instance every time ? no
- dimensions of map in km ?
- collect requirements and dependencies ! -> pip install -r requirements.txt
- dissociate views
- maps : https://leaflet-extras.github.io/leaflet-providers/preview/ + logo png
- start info page

## Benchmark


## Modules 

jinja2, mpld3, PIL
npm leaflet-rotatedmarker

## Questions

-   authentication ?
-   approximate mesh from points cloud -> big points
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
