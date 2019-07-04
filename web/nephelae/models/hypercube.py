import io
import logging
import math
import os
import urllib
import base64

import matplotlib.cm as cm
import matplotlib.pyplot as plt
import numpy as np
from matplotlib.colors import ListedColormap
from netCDF4 import MFDataset

var_time = 'time'        # Time in seconds since 1995-1-1 00:00:00
var_altitude = 'VLEV'    # Vertical levels in km ASL
var_upwind = 'WT'        # Upwind in m/s
var_lwc = 'RCT'          # Liquid water content in KG/KG ?

if 'MESO_NH' in os.environ :
    hypercube = MFDataset(os.environ['MESO_NH'])
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

def horizontal_slice(variable, time_index=0, altitude_index=0, x1=None, x2=None, y1=None, y2=None):
    try:
        return hypercube.variables[variable][time_index, altitude_index, x1:x2, y1:y2]
    except KeyError:
        logging.error('Variable \'' + variable + '\' does not exist')
    except ValueError:
        logging.error('Indexes must be valid')

def print_horizontal_clouds(time, altitude):
    # Get slice
    h_slice = horizontal_slice(var_lwc, time, altitude)

    # Write image to buffer
    buf = io.BytesIO()
    plt.imsave(buf, h_slice, origin='lower', vmin=0, cmap=transparent_cmap('Purples'), format='png')
    plt.close()
    buf.seek(0)
    return buf

# Returns a base64 encoded string containing hcs cloud data
def encode_horizontal_clouds(time_index, altitude_index):

    # Get slice
    h_slice = horizontal_slice(var_lwc, time_index, altitude_index)
    # Create pyplot image
    plt.imshow(h_slice, origin='lower',vmin=0, vmax=max_lwc())
    title = 'Liquid Water Content in kg/kg' #at ' + str(int(self.get_altitude())) + 'm ASL'
    plt.title(title)
    plt.set_cmap('viridis')
    plt.colorbar()

    # Write image to buffer
    buf = io.BytesIO()
    plt.savefig(buf, format='png')
    plt.close()

    # Encode buffer in base64 string
    buf.seek(0)
    data = base64.b64encode(buf.read())
    buf.close()
    encodedImage = 'data:image/jpg;base64,' + urllib.parse.quote(data)

    return encodedImage

# Returns a base64 encoded string containing hcs upwind data
def encode_horizontal_thermals(time_index, altitude_index):

    h_slice = horizontal_slice(var_upwind, time_index, altitude_index)

    # Create pyplot image
    plt.imshow(h_slice, origin='lower', vmin=min_upwind(), vmax=max_upwind())
    plt.title('Vertical air speed in m/s')
    plt.set_cmap('viridis')
    plt.colorbar()

    # Write image to buffer
    buf = io.BytesIO()
    plt.savefig(buf, format='png')
    plt.close()

    # Encode buffer in base64 string
    buf.seek(0)
    data = base64.b64encode(buf.read())
    buf.close()
    encodedImage = 'data:image/png;base64,' + urllib.parse.quote(data)

    return encodedImage

########## UTILITY METHODS ##########

def max_lwc():
    return max(getattr(hypercube.variables[var_lwc], 'actual_range'))

def max_time_index():
    return len(hypercube.variables[var_time]) - 1

def max_altitude_index():
    return len(hypercube.variables[var_altitude]) - 1

# Compute max upwind to fix plot colorbar
def max_upwind():
    return max(getattr(hypercube.variables[var_upwind], 'actual_range'))

# Compute min upwind to fix plot colorbar
def min_upwind():
    return min(getattr(hypercube.variables[var_upwind], 'actual_range'))

# Get altitude !in meters! from altitude_index !CHECK THIS METHOD'S CORRECTNESS!
def get_altitude(altitude_index):
    return 1000*hypercube.variables[var_altitude][altitude_index, 0, 0]

# Get date !in seconds since epoch! from time_index
def get_seconds(time_index):
    return hypercube.variables[var_time][time_index]

def index_from_ratio(time_ratio, altitude_ratio):

    time_index = int(0.01*time_ratio*max_time_index())
    altitude_index = int(0.01*altitude_ratio*max_altitude_index())

    return time_index, altitude_index
