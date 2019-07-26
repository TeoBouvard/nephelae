# NEPHELAE : Network for studying Entrainment and microPHysics of cLouds using Adaptive Exploration
  
  
### Table of contents

* [Q/A](#qa)  
* [User Guide](#user-guide)  
* [Dev Notes](#dev-notes)  
* [Miscellaneous](#miscellaneous)  
* [Todo](#todo) 
* [Prerequisites](#prerequisites)  

---

<a name="qa"></a>

### Q/A

**What is this ?**  
This is a web application designed as an interface between the fleet of UAV used by the Nephelae project and Météo-France users. It comprises various tools to help them visualize the data being acquired from the drones.


**How do I install it ?**  
Clone the repo, cd into it and `make install`. You can get all the `make` targets by simply running `make help`.


**How do I run it ?**  
Once installed (make sure to check the prerequisites), you can launch the server by running [`make runserver`]. You can then open a web browser (chrome or chromium preferably) and go to [localhost:8000](http://localhost:8000). As the server broadcasts on the whole network, you can use this interface from every computer on the network, by changing `localhost` to the server's IP address in the URL.
  

**How does it work ?**  
This webapp is based on a client-server architecture. When the client requests a web page, the server compares the requested URL to every entry in the [URL file](web/nephelae/urls.py). If it matches one entry, the corresponding [view](web/nephelae/views/) is called. A view can call [model](web/nephelae/models) methods , where the logic is located. The view then returns a response containing the data requested. HTTP or JSON responses are sent back by the server to the client, where it is handled by [scripts](web/nephelae/static/js/) and displayed according to [templates](web/nephelae/templates/) and [stylesheets](web/nephelae/static/css/).
  

**How can I tune it ?**  
Most of the display tuning is located in the javascript files. You can modify them and reload the pages to see it in action. When doing so, make sure to disable browser caching, or the scripts won't be requested to the server but taken from the cache.
  

**I updated the views/models but nothing changes, what is happening ?**  
For updates concerning server-side files to take place, you have to restart the server. You can `ctrl-C` to stop it, and re-run `make runserver`. Note that this is not necessary when updating client-side files (js, css, html files), as long as browser caching is disabled. If you are in developement, use the dev server which reloads automatically by tracking file changes. To do so, switch to dev server in the `makefile`.
  

**Why are all the javascript librairies locally downloaded and not taken from Content Delivery Networks ?**  
This web application is supposed to be used in remote places without any internet connection, and therefore downloads every external asset during installation.
  

**I do not have a Meso_NH.nc file, what can I do ?**  
You can download a copy from [their website](http://mesonh.aero.obs-mip.fr/mesonh54). However, if you don't feel like downloading such a big file, you can reference any `*.nc` file with your `$MESO_NH` environment variable, and it will *work*.

**I don't want to install paparazzi but want a demo, what can I do ?**  
I will upload a Paparazzi simultion to have a *standalone* demo in the future.

---

<a name="user-guide"></a>

### User Guide

**General**

Every tool in this webapp has a controller located at the top right of the page. You can move it along the vertical axis by dragging the handle, and extend it along the horizontal axis by dragging its left side. You can toggle its visibility by pressing the H key on your keyboard.

**2D tracking**

* You can choose which layers to display by hovering the layers icon at the bottom right of the map. 
* You can tune the appearance of the clouds and thermals layers in the controller. 
* You can download IGN map tiles of the visible map by clicking `Download IGN` in the `Tools` folder of the controller. This will download all map tiles for offline use of the current map. This might take a few seconds (minutes?) depending on your internet connection. Keep in mind that a 10km * 10km map is at least 150MB (10k tiles).
* You can get live infos about a UAV by clicking on it.
* You can set MesoNH cross-section altitude in the controller. If you want the cross-section to follow one of the UAVs, you can do so by clicking on a UAV and then on `SYNC MESONH`. It will synchronize time and altitude of the cross-section with the position of the UAV. Click anywhere on the altitude slider to stop syncing.
If you are lost, click the home icon at the top left of the map to get back to base.

**3D tracking**

In the controller, `Focus on fleet` will place the camera so that every UAV is visible.

**Temporal Sensor Data**

* Choose the UAVs from which you want to display data by selecting them in the `UAVs` folder of the controller. 
* Choose the sensor data you want to display in the `Variables` folder of the controller. 
* Choose the length of the data you want to display in `Controls`.
* Select `Streaming` if you want incoming data to be displayed automatically.
* While streaming is paused, you can zoom on the charts by selecting a desired area. Zoom back out by double-clicking on the chart.

**Spatial Sensor Data**

Same tool as the previous one, but data is displayed as a function of space rather than time. Hover a line to get details. A colorbar is displayed if only one UAV is selected. This visualization does not support streaming without consequent drawbacks, so you will have to click `Update Plot` if you want to fetch the latest data.

**Sections**

This tool is used to explore MesoNH files by displaying cross sections at a given time, altitude and variable.

**Cloud Data and Vertical Profiles**

Not yet implemented because of mapping interface still missing. Will be used to display macro informations about the cloud being explored.

**Commands**

Not yet implemented. Will be used to have an overview of the fleet's state and give high-level orders to the fleet.

---

<a name="dev-notes"></a>

**Dev Notes**


---

<a name="todo"></a>

### Todo

- requête box au mapping
- bounds to json
- reduce array size in image overlay (memory problems?)
- limit display radius in map or sparse matrix ? can't find a way 
- simulation path update does not work, have to redraw it entirely
- WARNING HARDCODED VALUE OF MESONH MAX TIME IN MAP.JS(715)
- get_positions parameters (real | simulation)
- ability to focus on single uav in 3d

- k-means clustering, then convex hull ?
- why is message.data an array ? (3d data ?)

---

<a name="miscellaneous"></a>

### Miscellaneous  

- [Grib parameters table](https://www.nco.ncep.noaa.gov/pmb/docs/grib2/GRIB2_parmeter_conversion_table.html)
- [dat.gui](https://github.com/dataarts/dat.gui) -> [paper-gui](https://github.com/google/paper-gui)
- [icons](https://material.io/tools/icons/?style=baseline)

---

<a name="prerequisites"></a> 

### Prerequisites  

- A running Paparazzi simulation, or real UAVs flying (see [Paparazzi wiki](https://wiki.paparazziuav.org/wiki/)). 
- A Meso_NH file referenced by `$MESO_NH`.

</p>