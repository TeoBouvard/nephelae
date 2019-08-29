import io
import json
import os
import sys

import matplotlib.pyplot as plt
import numpy as np
from netCDF4 import MFDataset

from nephelae.mapping  import GprPredictor
from nephelae.mapping  import WindKernel
from nephelae.mapping  import WindMapConstant

from nephelae_mesonh import MesonhVariable, MesonhMap

from . import utils
from . import tracker

var_upwind = 'WT'        # Upwind in m/s
var_lwc = 'RCT'          # Liquid water content in KG/KG ?
var_wind_u = 'UT'          # Liquid water content in KG/KG ?
var_wind_v = 'VT'          # Liquid water content in KG/KG ?

maps = {}

try:
    hwind = WindMapConstant('Horizontal wind', [8.5, 0.9])
    maps['LWC']  = GprPredictor('Liquid water', tracker.db, ['RCT'],
                                WindKernel([70.0, 80.0, 80.0, 60.0], 1.0e-8, 1.0e-10, hwind),
                                computesStddev = False)
    # maps['WT']   = GprPredictor('Vertical wind', tracker.db,  ['WT'],
    #                             WindKernel([70.0, 80.0, 80.0, 60.0], 5, 0.05, maps['hwind']))
except Exception as e:
    print("Got exception ! :", e)
    exc_type, exc_obj, exc_tb = sys.exc_info()
    fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
    print(exc_type, fname, exc_tb.tb_lineno)
    sys.stdout.flush()
    raise e

# Precheck and variable assignment
if 'MESO_NH' in os.environ:
    hypercube = MFDataset(os.environ['MESO_NH'])
    clouds = MesonhVariable(hypercube, var_lwc, interpolation='linear')
    thermals = MesonhVariable(hypercube, var_upwind, interpolation='linear')
    wind_u = MesonhVariable(hypercube, var_wind_u, interpolation='linear')
    wind_v = MesonhVariable(hypercube, var_wind_v, interpolation='linear')

    maps['clouds']   = MesonhMap('Liquid water (MesoNH)',  hypercube, 'RCT')
    maps['thermals'] = MesonhMap('Vertical wind (MesoNH)', hypercube, 'WT')
else:
    print('Environement variable $MESO_NH is not set. Update it in /etc/environment')
    exit()


def discover_maps():
    # return {'map_names': ['map0', 'map1', 'map2']}
    # return {'map0': {'url':'thermals','name':'Map0'}, 
    #         'map1': {'url':'thermals','name':'Map1'}, 
    #         'map2': {'url':'thermals','name':'Map2'}}
    # return {'clouds'  : {'url':'clouds',  'name':'Clouds'}, 
    #         'thermals': {'url':'thermals','name':'Thermals'}}
    res = {}
    for key in maps.keys():
        res[key] = {'url':key, 'name' : maps[key].name}
    return res


def print_horizontal_slice(variable_name, u_time, u_altitude, bounds, origin, thermals_cmap, clouds_cmap, transparent):

    x0, x1, y0, y1 = utils.bounds2indices(bounds, origin)

    h_slice = maps[variable_name][u_time, x0:x1, y0:y1, u_altitude].data.squeeze().T
    rng     = maps[variable_name].range()

    # To be made dynamic
    if variable_name == 'clouds':
        colormap = utils.transparent_cmap(clouds_cmap) if transparent else clouds_cmap
    # elif variable_name == 'thermals':
    else:
        colormap = utils.transparent_cmap(thermals_cmap) if transparent else thermals_cmap

    # Write image to buffer
    buf = io.BytesIO()
    if not rng:
        plt.imsave(buf, h_slice, origin='lower', cmap=colormap, format='png')
    else:
        plt.imsave(buf, h_slice, origin='lower', vmin=rng[0].min, vmax=rng[0].max, cmap=colormap, format='png')
    plt.close()
    buf.seek(0)

    return buf


def get_horizontal_slice(variable, time_value, altitude_value, x0=None, x1=None, y0=None, y1=None):

    if variable == var_lwc:
        return clouds[time_value, x0:x1, y0:y1, altitude_value].data.T

    elif variable == var_upwind:
        return thermals[time_value, x0:x1, y0:y1, altitude_value].data.T

    elif variable == var_wind_u:
        return wind_u[time_value, x0:x1, y0:y1, altitude_value].data.T

    elif variable == var_wind_v:
        return wind_v[time_value, x0:x1, y0:y1, altitude_value].data.T


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
    min_x = clouds.bounds[1].min
    max_x = clouds.bounds[1].max
    nb_points = len(clouds[clouds.bounds[0].min, clouds.bounds[3].min, :, :].data)

    return np.linspace(min_x, max_x, nb_points).tolist()


def box():
    bounds = clouds.bounds
    box = [
        {'min': bounds[0].min, 'max':bounds[0].max},
        {'min': bounds[3].min, 'max':bounds[3].max},
        {'min': bounds[2].min, 'max':bounds[2].max},
        {'min': bounds[1].min, 'max':bounds[1].max}]
    return box

