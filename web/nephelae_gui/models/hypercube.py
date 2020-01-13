import io
import json
import os
import sys
import time

from utm import from_latlon, to_latlon
import matplotlib.pyplot as plt
import numpy as np
from PIL import Image

try:
    from nephelae.mapping import compute_list_of_coms
    from nephelae.mapping import compute_bounding_box
    from nephelae.mapping import compute_selected_element_volume
    from nephelae.mapping import BorderIncertitude, BorderRaw
    
    from nephelae.database import CloudData
    
    imcount = 0
    
    from . import utils
    from . import common
    
    maps                     = common.scenario.maps
    hypercube                = common.scenario.mesonhDataset
    websockets_cloudData_ids = common.websockets_cloudData_ids
    websockets_point_ids     = common.websockets_point_ids
    localFrame               = common.scenario.localFrame

except Exception as e:
    import sys
    import os
    # Have to do this because #@%*&@^*! django is hiding exceptions
    print("# Caught exception #############################################\n    ", e, flush=True)
    exc_type, exc_obj, exc_tb = sys.exc_info()
    fname = exc_tb.tb_frame.f_code.co_filename
    print(exc_type, fname, exc_tb.tb_lineno,
          end="\n############################################################\n\n\n", flush=True)
    raise e

def discover_maps():
    res = {}
    for key in maps.keys():
        if maps[key].bounds()[0] is not None:
            x = maps[key].bounds()
            boundaries = (x[0].min, x[0].max, x[1].min, x[1].max)
        else:
            boundaries = maps[key].bounds()

        res[key] = {'url':key, 'name' : maps[key].name, 'sample_size':
                maps[key].sample_size(), 'range': boundaries}
    print(res)
    return res

def print_horizontal_slice(id_client, variable_name, u_time, u_altitude,
        bounds, origin, thermals_cmap, clouds_cmap, transparent):
    # Converting lower left corner and upper right corner from (lat,lon) to utm
    utmBounds = [from_latlon(latitude=bounds['south'], longitude=bounds['west']),
                 from_latlon(latitude=bounds['north'], longitude=bounds['east'])]
    localFrame = common.scenario.localFrame.position
    x0 = utmBounds[0][0] - localFrame.x
    x1 = utmBounds[1][0] - localFrame.x
    y0 = utmBounds[0][1] - localFrame.y
    y1 = utmBounds[1][1] - localFrame.y

    # indices must be adapted to the resolution of the map. Indices are related
    # to the outer limit of the image outside the pixels, whereas coordinates
    # in maps are assumed to be relative the the center of pixels (i.e. bounds
    # must shrink by half of a pixel size).
    resx_2 = maps[variable_name].resolution()[1] / 2.0
    resy_2 = maps[variable_name].resolution()[2] / 2.0
    x0 = x0 + resx_2
    x1 = x1 - resx_2
    y0 = y0 + resy_2
    y1 = y1 - resy_2

    if "LWC" in variable_name:
        print("Printing slice,", variable_name + " : [" + 
              str(u_time) + ", " + str(x0)+':'+str(x1) + ", " + str(y0)+':'+str(y1) + ", " + str(u_altitude) + "]")
    
    if "LWC" in variable_name:
        t0 = time.time()

    map0 = maps[variable_name][u_time, x0:x1, y0:y1, u_altitude]

    if id_client in websockets_cloudData_ids and not "_border" in variable_name:
        websockets_cloudData_ids[id_client].send_cloud_data(variable_name,
            CloudData.from_scaledArray(map0))

    if isinstance(map0, tuple) and "_border" in variable_name:
        h_slice_data = map0[0].data + map0[1].data
        h_slice = h_slice_data.squeeze().T
    else:
        h_slice = map0.data.squeeze().T


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
    # colormap = 'viridis'
    # rng      = maps['clouds'].range()
    if "LWC" in variable_name:
        h_slice[h_slice < 0.0] = 0.0
    
    # rFactor = 4
    minRes = 1080.0
    rFactor = (int(max(minRes / min(h_slice.shape), 1))
        if min(h_slice.shape) != 0 else 1)

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
    map0 = maps[variable][time_value, x0:x1, y0:y1, altitude_value]
    x_axis = np.linspace(map0.bounds[0].min, map0.bounds[0].max,
            map0.data.shape[0])
    y_axis = np.linspace(map0.bounds[1].min, map0.bounds[1].max,
            map0.data.shape[1])
    return (map0.data.T, x_axis, y_axis)

def get_center_of_horizontal_slice(variable, time_value, altitude_value,
        threshold, x0=None, x1=None, y0=None, y1=None):
    map0 = maps[variable][time_value, x0:x1, y0:y1, altitude_value]
    x = compute_list_of_coms(map0, threshold)
    list_x, list_y = [], []
    for coords in x:
        if x is not None:
            list_x.append(coords[0])
            list_y.append(coords[1])
    return {'list_x': list_x, 'list_y': list_y}

def get_bounding_boxes_of_horizontal_slice(variable, time_value, altitude_value,
        threshold, x0=None, x1=None, y0=None, y1=None):
    map0 = maps[variable][time_value, x0:x1, y0:y1, altitude_value]
    x = compute_bounding_box(map0, threshold)
    list_bounds_x = [[boundaries[0].min, boundaries[0].max] for boundaries in x]
    list_bounds_y = [[boundaries[1].min, boundaries[1].max] for boundaries in x]
    return {'boundaries_x': list_bounds_x, 'boundaries_y': list_bounds_y}

def get_volume_of_selected_cloud(variable, time_value, altitude_value, c1, c2,
        threshold, x0=None, x1=None, y0=None, y1=None):
    map0 = maps[variable][time_value, x0:x1, y0:y1, altitude_value]
    coords = map0.dimHelper.to_index((c1, c2))
    res = compute_selected_element_volume(coords, map0, threshold)
    return {'data': res}

def get_contour_of_horizontal_slice(variable, time_value,
        altitude_value, threshold, x0=None, x1=None, y0=None, y1=None):
    res = None
    map0 = maps[variable][time_value, x0:x1, y0:y1, altitude_value]
    x_axis = np.linspace(map0.bounds[0].min, map0.bounds[0].max,
        map0.data.shape[0])
    y_axis = np.linspace(map0.bounds[1].min, map0.bounds[1].max,
        map0.data.shape[1])
    print(threshold)
    if variable+'_std' in maps.keys():
        bdcloud = BorderIncertitude('LWC Bd', maps[variable],
        maps[variable+'_std'], thr=threshold)
        borders = bdcloud[time_value, x0:x1, y0:y1, altitude_value]
        res = {'inner_border': borders[0].data.T.tolist(),
                'outer_border': borders[1].data.T.tolist(),
                'x_axis': x_axis.tolist(),
                'y_axis': y_axis.tolist()}
    else:
        bdcloud = BorderRaw('LWC Bd', maps[variable], thr=threshold)
        borders = bdcloud[time_value, x0:x1, y0:y1, altitude_value]
        res = {'inner_border': borders.data.T.tolist(),
                'outer_border': [],
                'x_axis': x_axis.tolist(),
                'y_axis': y_axis.tolist()}
    return res

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
