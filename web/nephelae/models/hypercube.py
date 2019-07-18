import io
import json
import os

import matplotlib.cm as cm
import matplotlib.pyplot as plt
import numpy as np
from geopy.distance import distance
from matplotlib.colors import ListedColormap
from netCDF4 import MFDataset

from nephelae_simulation.mesonh_interface import *

var_upwind = 'WT'        # Upwind in m/s
var_lwc = 'RCT'          # Liquid water content in KG/KG ?
var_wind_u = 'UT'          # Liquid water content in KG/KG ?
var_wind_v = 'VT'          # Liquid water content in KG/KG ?

if 'MESO_NH' in os.environ:
    hypercube = MFDataset(os.environ['MESO_NH'])
    clouds = MesoNHVariable(hypercube, var_lwc, interpolation='linear')
    thermals = MesoNHVariable(hypercube, var_upwind, interpolation='linear')
    wind_u = MesoNHVariable(hypercube, var_wind_u, interpolation='linear')
    wind_v = MesoNHVariable(hypercube, var_wind_v, interpolation='linear')
else:
    print('Environement variable $MESO_NH is not set. Update it in /etc/environment')
    exit()


def print_horizontal_slice(variable_name, u_time, u_altitude, bounds, origin, thermals_cmap, clouds_cmap, transparent):

    x0, x1, y0, y1 = bounds2indices(bounds, origin)

    # Get slice
    if variable_name == 'clouds':
        h_slice = clouds[u_time, u_altitude, y0:y1, x0:x1].data
        colormap = transparent_cmap(
            clouds_cmap) if transparent else clouds_cmap
        min_slice = 0
        max_slice = clouds.actual_range[1]
    elif variable_name == 'thermals':
        h_slice = thermals[u_time, u_altitude, y0:y1, x0:x1].data
        h_slice[h_slice < 0] = 0
        colormap = transparent_cmap(
            thermals_cmap) if transparent else thermals_cmap
        min_slice = 0
        max_slice = thermals.actual_range[1]

    # Write image to buffer
    buf = io.BytesIO()
    plt.imsave(buf, h_slice, origin='lower', vmin=min_slice,
               vmax=max_slice, cmap=colormap, format='png')
    plt.close()
    buf.seek(0)
    return buf


def get_wind(u_time, u_altitude, bounds, origin):

    x0, x1, y0, y1 = bounds2indices(bounds, origin)
    u = wind_u[u_time, u_altitude, y0:y1, x0:x1].data
    v = wind_v[u_time, u_altitude, y0:y1, x0:x1].data
    u_data = u.flatten()
    v_data = v.flatten()

    # header template
    header = {
        'parameterUnit': 'm.s-1',
        'parameterCategory': 2,
        'parameterNumber': 2,
        'parameterNumberName': 'eastward_wind',
        'dx': 25.0,
        'dy': 25.0,
        'la1': bounds['north'],
        'la2': bounds['south'],
        'lo1': bounds['west'],
        'lo2': bounds['east'],
        'nx': np.size(u, 0),
        'ny': np.size(u, 1),

    }

    s1 = json.dumps({'header': header, 'data': u_data.tolist()})

    header['parameterNumber'] = 3
    header['parameterNumberName'] = 'northward_wind'
    header['nx'] = np.size(v, 0)
    header['ny'] = np.size(v, 1)

    s2 = json.dumps({'header': header, 'data': v_data.tolist()})

    return [eval(s1), eval(s2)]


# ######### UTILITY METHODS ######### #


def transparent_cmap(original_cmap):

    # Choose colormap
    cmap = cm.get_cmap(original_cmap)

    # Get the colormap colors
    my_cmap = cmap(np.arange(cmap.N))

    # Set alpha
    my_cmap[:, -1] = np.linspace(0, 1, cmap.N)

    return ListedColormap(my_cmap)


# Compute where the value zero lies on the colorscale
def colormap_zero(variable_name, time_value, altitude_value):

    if variable_name == 'clouds':
        matrix = clouds[time_value, altitude_value, :, :].data
    elif variable_name == 'thermals':
        matrix = thermals[time_value, altitude_value, :, :].data

    minv = matrix.min()
    maxv = matrix.max()

    if minv == maxv:
        return 0.5
    else:
        return abs(minv / (maxv - minv))


def axes():
    min_x = clouds.bounds[2].min
    max_x = clouds.bounds[2].max
    nb_points = len(clouds[clouds.bounds[0].min, clouds.bounds[1].min, :, :].data)

    return np.linspace(min_x, max_x, nb_points).tolist()


def box():
    bounds = clouds.bounds
    box = [
        {'min': bounds[0].min, 'max':bounds[0].max},
        {'min': bounds[1].min, 'max':bounds[1].max},
        {'min': bounds[2].min, 'max':bounds[2].max},
        {'min': bounds[3].min, 'max':bounds[3].max}]
    return box


def bounds2indices(bounds, origin):

    # Compute projected origin coordinates
    x_projected_origin = [bounds['south'], origin['lng']]
    y_projected_origin = [origin['lat'], bounds['west']]

    # Compute distances to map corners
    distance_x0 = distance(x_projected_origin, [bounds['south'], bounds['west']]).meters
    distance_x1 = distance(x_projected_origin, [bounds['south'], bounds['east']]).meters
    distance_y0 = distance(y_projected_origin, [bounds['south'], bounds['west']]).meters
    distance_y1 = distance(y_projected_origin, [bounds['north'], bounds['west']]).meters

    # Adjust for negative indices
    x0 = distance_x0 if origin['lng'] < bounds['west'] else -distance_x0
    x1 = distance_x1 if origin['lng'] < bounds['east'] else -distance_x1
    y0 = distance_y0 if origin['lat'] < bounds['south'] else -distance_y0
    y1 = distance_y1 if origin['lat'] < bounds['north'] else -distance_y1

    return x0, x1, y0, y1
