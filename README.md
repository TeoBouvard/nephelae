# NEPHELAE : Network for studying Entrainment and microPHysics of cLouds using Adaptive Exploration

**Q : What is this ?**  
A : This is a web application designed as an interface between the fleet of UAV used by the Nephelae project and Météo-France users. It comprises various tools to help them visualize the data being acquired from the drones.


**Q : How do I install it ?**  
A : Clone the repo and run `install.sh`. You should define two environment variables for this to work :  
- `$MAP_TILES` referencing a map atlas. If you don't plan on using it offline, this is not necessary.
- `$MESO_NH` referencing the Meso_NH.nc file.
  

**Q : How do I run it ?**  
A : Once installed (make sure to check the prerequisites), you can launch the server by running `runserver.sh`. You can then open a web browser (chrome or chromium preferably) and go to `localhost:8000`. As the server broadcasts on the whole network, you can use this interface from every computer on the network, by changing "localhost" to the server's IP address in the URL.
  

**Q : How does it work ?**  
A : This webapp is based on a client-server architecture. When the client requests a web page, the server compares the requested URL to every entry in the web/URL.py file. If it matches one entry, the corresponding view (web/nepeheale/views) is called. A view can call model methods (web/nephelae/models), where the logic is located. The view then returns a response containing the data requested. HTTP or JSON responses are sent back by the server to the client, where it is handled by scripts (web/nephelae/static/js) and displayed according to templates (web/nephelae/templates) and stylesheets (web/nephelae/static/css).
  

**Q : How can I tune it ?**  
A : Most of the display tuning is located at the top of the javascript files : refresh rate, initial trail length ... You can change these parameters and reload the pages to see it in action. When doing so, make sure to disable browser caching, or the scripts won't be requested to the server but taken from the cache.
  

**Q : I updated the views/models but nothing changes, what is happening ?**  
A : For updates concerning server-side programming files to take place, you have to restart the server. You can ctrl-c twice, and re-run runserver.sh. Note that this is not necessary when updating client-side programming files (js, css, html files), as long as browser caching is disabled.
  

**Q : Why are all the javascript librairies locally downloaded and not taken from Content Delivery Networks ?**  
A : Because this web application is supposed to be used in remote places without any internet connection.
  

**Q : I do not have a Meso_NH.nc file, what can I do ?**  
A : You can reference any .nc file with your `$MESO_NH` environment variable, and it will *work*. The original file is 70GB so it did not fit in a commit, sorry.
   
    
## Prerequisites  

- A running Paparazzi simulation, or real UAVs flying (see [Paparazzi wiki](https://wiki.paparazziuav.org/wiki/)). 
- A Meso_NH file referenced by `$MESO_NH`. 


## TODO

- os.environ['MESO_NH'], os.environ['MAP_TILES'] -> define env variables in install script !
- requête repère mobile au mapping
- requête box au mapping
- bounds to json
- reduce array size in image overlay (memory problems?)
- organize base css
- 3d model of uavs ?
- simulation path update does not work, have to redraw it entirely
- simplify bounds management ?
- WARNING HARDCODED VALUE OF MESONH MAX TIME IN MAP.JS(715)
- replace dat gui and materialize style in install script
- add utils model

## Links  

- [Grib parameters table](https://www.nco.ncep.noaa.gov/pmb/docs/grib2/GRIB2_parmeter_conversion_table.html)
- [dat.gui](https://github.com/dataarts/dat.gui) -> [paper-gui](https://github.com/google/paper-gui)
- [icons](https://material.io/tools/icons/?style=baseline)


## Questions

-   k-means clustering, then convex hull ?
-   why is message.data an array ? (3d data ?)
-   can I have a way to ask all sample tags (not all tags)