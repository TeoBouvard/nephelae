import base64
import io
import logging
import math
import os
import urllib

import matplotlib.cm as cm
import matplotlib.pyplot as plt
import numpy as np
from matplotlib.colors import ListedColormap
from netCDF4 import MFDataset

from nephelae_simulation.mesonh_interface import *

var_time = 'time'        # Time in seconds since 1995-1-1 00:00:00
var_altitude = 'VLEV'    # Vertical levels in km ASL
var_upwind = 'WT'        # Upwind in m/s
var_lwc = 'RCT'          # Liquid water content in KG/KG ?

if 'MESO_NH' in os.environ:
    hypercube = MFDataset(os.environ['MESO_NH'])
    clouds = MesoNHVariable(hypercube, var_lwc, interpolation='linear')
    thermals = MesoNHVariable(hypercube, var_upwind, interpolation='linear')
else :
    print('Environement variable $MESO_NH is not set. Update it in /etc/environment')
    exit()

def transparent_cmap(original_cmap):

    # Choose colormap
    cmap = cm.get_cmap(original_cmap)

    # Get the colormap colors
    my_cmap = cmap(np.arange(cmap.N))

    # Set alpha
    my_cmap[:,-1] = np.linspace(0, 1, cmap.N)

    return ListedColormap(my_cmap)

def print_horizontal_variable(variable_name, u_time, u_altitude):

    # Get slice
    if variable_name == 'clouds':
        h_slice = clouds[u_time, u_altitude, :, :].data
    elif variable_name == 'thermals':
        h_slice = thermals[u_time, u_altitude, :, :].data

    # Write image to buffer
    buf = io.BytesIO()
    plt.imsave(buf, h_slice, origin='lower', vmin=0, cmap=transparent_cmap('Purples'), format='png')
    plt.close()
    buf.seek(0)
    return buf

########## UTILITY METHODS ##########

# Compute where the value zero lies on the colorscale
def colormap_zero(time_value, altitude_value):
    matrix = thermals[time_value, altitude_value, :, :].data
    minv = matrix.min()
    maxv = matrix.max()
    return abs(minv/(maxv-minv))