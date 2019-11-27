import io
import json
import os
import sys
import time

import matplotlib.pyplot as plt
import numpy as np
from PIL import Image

imcount = 0
try:
    from nephelae.types    import Bounds
    from nephelae.mapping  import GprPredictor, ValueMap, StdMap
    from nephelae.mapping  import WindKernel
    from nephelae.mapping  import WindMapConstant, WindObserverMap
    
    from nephelae_mesonh import MesonhVariable, MesonhMap, MesonhDataset
    
    from . import utils
    from . import tracker
    from . import common
    
    maps = {}

    # hwind = WindMapConstant('Horizontal wind', [8.5, 0.9])
    hwind = WindObserverMap('Horizontal wind', sampleName=str(['UT','VT']))
    common.db.add_sensor_observer(hwind)

    liquid_kernel = WindKernel([50.0, 50.0, 50.0, 60.0], 1.0e-8, 1.0e-10, hwind)
    wind_kernel = WindKernel([70.0, 40.0, 40.0, 60.0], 1.0e-8, 1.0e-10, hwind)
    
    gpr_lwc = GprPredictor(common.db, ['RCT'], liquid_kernel)
    gpr_wt = GprPredictor(common.db, ['WT'], wind_kernel)

    maps['LWC'] = ValueMap('Liquid Water', gpr_lwc)
    maps['LWC_STD'] = StdMap('Liquid Water std', gpr_lwc)

    maps['WT'] = ValueMap('Vertical Wind', gpr_wt)
    maps['WT_STD'] = StdMap('Vertical Wind std', gpr_wt)

    # Precheck and variable assignment
    if common.scenario.mesonhFiles is not None:
        hypercube = MesonhDataset(common.scenario.mesonhFiles)
        maps['clouds'] = MesonhMap('Liquid water (MesoNH)',  hypercube, 'RCT')
        maps['clouds'].dataRange = (Bounds(0.0,1.0e-4),)
        maps['thermals'] = MesonhMap('Vertical wind (MesoNH)', hypercube, 'WT')
        maps['hwind']    = MesonhMap('WS Wind (Mesonh)',       hypercube, ['UT','VT'])

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
        res[key] = {'url':key, 'name' : maps[key].name, 'sample_size': maps[key].sample_size()}
    print(res)
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
    
    rFactor = 4
    img = Image.fromarray(h_slice)
    h_slice = np.array(img.resize((h_slice.shape[0]*rFactor, h_slice.shape[1]*rFactor), Image.BICUBIC))
    # h_slice = np.array(img.resize((h_slice.shape[0]*rFactor, h_slice.shape[1]*rFactor), Image.NEAREST))
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
    return maps[variable][time_value, x0:x1, y0:y1, altitude_value].data.T

def get_wind(variable, u_time, u_altitude, bounds, origin):

    """Used to fetch vector2D field from maps for the wind overlay"""

    x0, x1, y0, y1 = utils.bounds2indices(bounds, origin)
    wind = maps[variable][u_time, x0:x1, y0:y1, u_altitude].data.squeeze()

    # header template
    header = {
        'parameterUnit': 'm.s-1',
        'parameterCategory': 2,
        'parameterNumber': 2,
        'parameterNumberName': 'eastward_wid',
        'dx' : 25.0,
        'dy' : 25.0,
        'la1': bounds['north'],
        'la2': bounds['south'],
        'lo1': bounds['west'],
        'lo2': bounds['east'],
        'nx' : wind.shape[0],
        'ny' : wind.shape[1],

    }

    s1 = json.dumps({'header': header, 'data': wind[:,:,0].ravel().tolist()})

    header['parameterNumber'] = 3
    header['parameterNumberName'] = 'northward_wind'

    s2 = json.dumps({'header': header, 'data': wind[:,:,1].ravel().tolist()})

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

