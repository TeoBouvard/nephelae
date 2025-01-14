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


~~**How do I install it ?**~~ For the moment, you can't. Nephelae base classes and are not yet properly packaged.

```shell
sudo apt-get -y install python3-pip redis-server virtualenv
git clone https://github.com/teobouvard/nephelae_gui.git
cd nephelae_gui
python3 -m venv venv
source venv/bin/activate
make install
make demo
```

You can then open a web browser and go to [localhost:8000](http://localhost:8000). As the server broadcasts on 0.0.0.0, you can use this interface from every computer on your network, by changing `localhost` to the server's IP address in the URL.
  

**How does it work ?**  
This webapp is based on a client-server architecture. When the client requests a web page, the server compares the requested URL to every entry in the [URL file](web/nephelae/urls.py). If it matches one entry, the corresponding [view](web/nephelae/views/) is called. A view can call [model](web/nephelae/models/) methods , where the logic is located. The view then returns a response containing the data requested. HTTP or JSON responses are sent back by the server to the client, where it is handled by [scripts](web/nephelae/static/js/) and displayed according to [templates](web/nephelae/templates/) and [stylesheets](web/nephelae/static/css/).
  
To display real time data coming from the UAV sensors, this webapp also implements WebSockets, which allows a persistent connection between client and server, and provides a full-duplex comunication channel between them. [Routing](web/nephelae/routing.py) is to WebSockets what [URLs](web/nephelae/urls.py) are to standard requests. [Consumers](web/nephelae/consumers.py) are to WebSockets what [views](web/nephelae/views/) are to standard requests.
  

**How can I tune it ?**  
Most of the display tuning is located in the javascript files. You can modify them and reload the pages to see it in action. When doing so, make sure to disable browser caching, or the scripts won't be requested to the server but taken from the cache.
  

**I updated the views/models but nothing changes, what is happening ?**  
For updates concerning server-side files to take place, you have to restart the server. You can `ctrl-C` to stop it, and re-run `make runserver`. Note that this is not necessary when updating client-side files (js, css, html files), as long as browser caching is disabled. If you are in developement, use the dev server which reloads automatically by tracking file changes. To do so, switch to dev server in the `makefile`.
  

**Why are all the javascript librairies locally downloaded and not taken from Content Delivery Networks ?**  
This web application is supposed to be used in remote places without any internet connection, and therefore downloads every external asset during installation.

 
**I do not have a Meso_NH.nc file, what can I do ?**  
You can download a copy from [their website](http://mesonh.aero.obs-mip.fr/mesonh54). However, if you don't feel like downloading such a big file, you can reference any `*.nc` file with your `$MESO_NH` environment variable, and it will *work*.
  
  
**I don't want to install paparazzi but want a demo, what can I do ?**  
A [demo database](demo/) is available. When you run `make demo`, this is the default database used. You can change it by looking at the variable in the `makefile`.

---

<a name="user-guide"></a>

### User Guide

**General**

Every tool in this webapp has a controller located at the top right of the page. You can move it along the vertical axis by dragging the handle, and extend it along the horizontal axis by dragging its left side. You can toggle its visibility by pressing the H key on your keyboard.
  
**Fleet**

Displays current state of the fleet, with current and past tasks assigned to each UAV.
In the future, you will be able to assign tasks via the controller.
  
**2D tracking**

* You can choose which layers to display by hovering the layers icon at the bottom right of the map. 
* You can tune the appearance of the clouds and thermals layers in the controller. 
* You can download IGN map tiles of the visible area by clicking `Download IGN` in the `Tools` folder of the controller. This will download visible map tiles for offline use of the current map. This might take a few seconds (minutes?) depending on your internet connection. Keep in mind that a 10km * 10km map is at least 150MB (10k tiles). You can check download status by looking at the server access log. The page will automatically reload 30 seconds after download has begun, to fetch downloaded tiles.
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

Same tool as the previous one, but sensor data is displayed as a function of space rather than time. Hover a line to get details. A colorbar is displayed if only one UAV is selected. This visualization does not support streaming without consequent drawbacks, so you will have to click `Update Plot` if you want to fetch the latest data.

**Sections**

This tool is used to explore MesoNH files by displaying cross sections at a given time, altitude and variable.

**Cloud Data and Vertical Profiles**

Not yet implemented because of mapping interface still missing. Will be used to display macro informations about the cloud being explored.

**Settings**

You can change the default values of variables used in the different pages. Changes are automatically saved, so you can exit the page right after making your changes. If you wish to revert all settings to their defaults, click the reset button.

---

<a name="dev-notes"></a>

**Dev Notes**

- Clients can initiate download of files on the server (map tiles). I think that this is particularly bad design, but it's mostly due to the fact that this app is supposed to be used without internet connection, and by running server and client on the same machine. If you think there is a better way to download map tiles for offline use, feel free to open an issue.
- WARNING HARDCODED VALUE OF MESONH MAX TIME IN MAP.JS(715)
- On raw data page, redrawing the charts on every message received causes the page to drop frames on old computers, and can even lead to the browser crashing. However, if you drag your cursor on the screen, it runs nearly smoothly. Maybe dragging your cursor on the screen triggers more frequent repaints, but this behaviour is really strange. Either switch to a real-time graphing library like Epoch.js (made for this purpose but not maintained) or investigate this strange behaviour.
- In file views, Path objects are casted to string for Python 3.5 compatibility. 
- Consider switching to Uvicorn as a deployment server, to handle interruption signals and shutdown the interface properly. It may be smart to have a module similar to manage.py, and to launch the server from here.


---

<a name="todo"></a>

### Todo

- requête box au mapping
- bounds to json
- WARNING HARDCODED VALUE OF MESONH MAX TIME IN MAP.JS(715)
- ability to focus on single uav in 3d
- benchmark frame position computations
- add pitch estimation in simulation / attitude message ?
- test install on clean VM
- db requests for macro parameters

- dbscan clustering, then convex hull ?

---

<a name="miscellaneous"></a>

### Miscellaneous  

- [Grib parameters table](https://www.nco.ncep.noaa.gov/pmb/docs/grib2/GRIB2_parmeter_conversion_table.html)
- [dat.gui](https://github.com/dataarts/dat.gui) -> [paper-gui](https://github.com/google/paper-gui)
- [icons](https://material.io/tools/icons/?style=baseline)

---

<a name="prerequisites"></a> 

### Prerequisites  

- A Paparazzi database referenced by `$PPRZ_DB`, a running Paparazzi simulation, or real UAVs flying (see [Paparazzi wiki](https://wiki.paparazziuav.org/wiki/)). You can find a demo database [here](demo/).
- A Meso_NH file referenced by `$MESO_NH`.
- python3, git, curl, sed
