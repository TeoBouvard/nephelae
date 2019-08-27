import io
import json
import os

import matplotlib.pyplot as plt
import numpy as np
from netCDF4 import MFDataset

from nephelae_simulation.mesonh_interface import MesoNHVariable
# from nephelae_mesonh import MesoNHVariable

from . import utils

var_upwind = 'WT'        # Upwind in m/s
var_lwc = 'RCT'          # Liquid water content in KG/KG ?
var_wind_u = 'UT'          # Liquid water content in KG/KG ?
var_wind_v = 'VT'          # Liquid water content in KG/KG ?

# Precheck and variable assignment
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

    x0, x1, y0, y1 = utils.bounds2indices(bounds, origin)

    # Get slice
    if variable_name == 'clouds':
        h_slice = get_horizontal_slice(var_lwc, u_time, u_altitude, x0, x1, y0, y1)
        colormap = utils.transparent_cmap(clouds_cmap) if transparent else clouds_cmap
        min_slice = 0
        max_slice = clouds.actual_range[1]
    elif variable_name == 'thermals':
        h_slice = get_horizontal_slice(var_upwind, u_time, u_altitude, x0, x1, y0, y1)
        #h_slice[h_slice < 0] = 0 # removes downwind from image
        colormap = utils.transparent_cmap(thermals_cmap) if transparent else thermals_cmap
        min_slice = thermals.actual_range[0]
        max_slice = thermals.actual_range[1]

    # Write image to buffer
    buf = io.BytesIO()
    plt.imsave(buf, h_slice, origin='lower', vmin=min_slice, vmax=max_slice, cmap=colormap, format='png')
    plt.close()
    buf.seek(0)

    return buf


def get_horizontal_slice(variable, time_value, altitude_value, x0=None, x1=None, y0=None, y1=None):

    if variable == var_lwc:
        return clouds[time_value, altitude_value, y0:y1, x0:x1].data

    elif variable == var_upwind:
        return thermals[time_value, altitude_value, y0:y1, x0:x1].data

    elif variable == var_wind_u:
        return wind_u[time_value, altitude_value, y0:y1, x0:x1].data

    elif variable == var_wind_v:
        return wind_v[time_value, altitude_value, y0:y1, x0:x1].data


def get_wind(u_time, u_altitude, bounds, origin):

    x0, x1, y0, y1 = utils.bounds2indices(bounds, origin)
    u = get_horizontal_slice(var_wind_u, u_time, u_altitude, x0, x1, y0, y1)
    v = get_horizontal_slice(var_wind_v, u_time, u_altitude, x0, x1, y0, y1)
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

