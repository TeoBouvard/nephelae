import io
import json
import os
import sys
import time

import matplotlib.pyplot as plt
import numpy as np

imcount = 0
try:
    from nephelae.mapping  import GprPredictor
    from nephelae.mapping  import WindKernel
    from nephelae.mapping  import WindMapConstant, WindMapUav
    
    from nephelae_mesonh import MesonhVariable, MesonhMap, MesonhDataset
    
    from . import utils
    from . import tracker
    from . import common
    
    var_upwind = 'WT'        # Upwind in m/s
    var_lwc = 'RCT'          # Liquid water content in KG/KG ?
    var_wind_u = 'UT'          # Liquid water content in KG/KG ?
    var_wind_v = 'VT'          # Liquid water content in KG/KG ?
    
    maps = {}
    # hwind = WindMapConstant('Horizontal wind', [8.5, 0.9])
    # hwind = WindMapUav(common.db)
    # maps['LWC']  = GprPredictor('Liquid water', common.db, ['RCT'],
    #                             WindKernel([70.0, 50.0, 50.0, 60.0], 1.0e-8, 1.0e-10, hwind),
    #                             computesStddev = False)
    # maps['LWC']  = GprPredictor('Liquid water', common.db, ['RCT'],
    #                             WindKernel([35.0, 50.0, 50.0, 30.0], 1.0e-8, 1.0e-10, hwind),
    #                             computesStddev = False)
    # maps['WT']  = GprPredictor('Vertical wind', common.db, ['WT'],
    #                             WindKernel([70.0, 40.0, 40.0, 60.0], 1.0e-8, 1.0e-10, hwind),
    #                             computesStddev = False)

    # Precheck and variable assignment
    if 'MESO_NH' in os.environ:
        # hypercube = MFDataset(os.environ['MESO_NH'])
        # hypercube = common.atm
        hypercube = MesonhDataset(common.atm)
        thermals = MesonhVariable(hypercube, var_upwind, interpolation='linear')
        wind_u = MesonhVariable(hypercube, var_wind_u, interpolation='linear')
        wind_v = MesonhVariable(hypercube, var_wind_v, interpolation='linear')
    
        maps['clouds']   = MesonhMap('Liquid water (MesoNH)',  hypercube, 'RCT')
        maps['thermals'] = MesonhMap('Vertical wind (MesoNH)', hypercube, 'WT')
    else:
        print('Environement variable $MESO_NH is not set. Update it in /etc/environment')
        exit()

except Exception as e:
    # Have to do this because #@%*&@^*! django is hiding exceptions
   print("# Caught exception #############################################\n    ", e)
   exc_type, exc_obj, exc_tb = sys.exc_info()
   fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
   print(exc_type, fname, exc_tb.tb_lineno,
         end="\n############################################################\n\n\n")
   raise e

def discover_maps():
    res = {}
    for key in maps.keys():
        res[key] = {'url':key, 'name' : maps[key].name}
    return res


def print_horizontal_slice(variable_name, u_time, u_altitude, bounds, origin, thermals_cmap, clouds_cmap, transparent):
    
    x0, x1, y0, y1 = utils.bounds2indices(bounds, origin)

    if "LWC" in variable_name:
        print("Printing slice,", variable_name + " : [" + 
              str(u_time) + ", " + str(x0)+':'+str(x1) + ", " + str(y0)+':'+str(y1) + ", " + str(u_altitude) + "]")
    
    if "LWC" in variable_name:
        t0 = time.time()
    h_slice = maps[variable_name][u_time, x0:x1, y0:y1, u_altitude].data.squeeze().T
    if "LWC" in variable_name:
        print("Ellapsed time :", time.time() - t0)
    rng     = maps[variable_name].range()

    # global imcount
    # if "LWC" in variable_name:
    #     print("Got slice, mean :", h_slice.ravel().mean())
    #     print("Got slice, rng  :", rng)
    #     plt.imsave(str(imcount)+".png", h_slice, origin='lower', cmap='viridis', format='png')
    #     imcount = imcount + 1


    # To be made dynamic
    if variable_name == 'clouds':
        colormap = utils.transparent_cmap(clouds_cmap) if transparent else clouds_cmap
    # elif variable_name == 'thermals':
    else:
        colormap = utils.transparent_cmap(thermals_cmap) if transparent else thermals_cmap

    # Write image to buffer
    colormap = 'viridis'
    # rng      = maps['clouds'].range()
    if "LWC" in variable_name:
        h_slice[h_slice < 0.0] = 0.0

    # h_slice = h_slice[::2, ::2]
    buf = io.BytesIO()
    # plt.imsave(buf, h_slice, origin='lower', cmap=colormap, format='png')
    if not rng:
        plt.imsave(buf, h_slice, origin='lower', cmap=colormap, format='png')
    else:
        plt.imsave(buf, h_slice, origin='lower', vmin=rng[0].min, vmax=rng[0].max, cmap=colormap, format='png')
    plt.close()
    buf.seek(0)

    return buf


def get_horizontal_slice(variable, time_value, altitude_value, x0=None, x1=None, y0=None, y1=None):
    
    if variable == var_wind_u:
        return wind_u[time_value, x0:x1, y0:y1, altitude_value].data.T
    elif variable == var_wind_v:
        return wind_v[time_value, x0:x1, y0:y1, altitude_value].data.T
    else:
        return maps[variable][time_value, x0:x1, y0:y1, altitude_value].data.T

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
    return hypercube.dimensions[3]['data'].tolist()


def box():
    dims = hypercube.dimensions
    box = [
        {'min': dims[0]['data'][0], 'max':dims[0]['data'][-1]},
        {'min': dims[1]['data'][0], 'max':dims[1]['data'][-1]},
        {'min': dims[3]['data'][0], 'max':dims[3]['data'][-1]},
        {'min': dims[2]['data'][0], 'max':dims[2]['data'][-1]}]
    return box

