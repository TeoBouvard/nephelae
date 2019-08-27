import matplotlib.cm as cm
import numpy as np
import utm
from geopy.distance import distance
from matplotlib.colors import ListedColormap


def compute_position(message):
    position = list(utm.to_latlon(message['utm_east'], message['utm_north'], message['utm_zone'], northern=True))
    position.append(message['alt'])
    return position


def compute_frame_position(message, nav_frame):
    position = compute_position(message)
    frame_position = translate_position(position, nav_frame)
    frame_position.append(message['alt'])
    return frame_position

def translate_position(real_world, origin):
    '''
    Returns the position of a point in the origin frame from its position in the real world
    @params : real_world and origin are [latitude, longitude] objects
    '''

    dx = distance(origin, [origin[0], real_world[1]]).meters
    dy = distance(origin, [real_world[0], origin[1]]).meters

    x = dx if real_world[1] > origin[1] else -dx
    y = dy if real_world[0] > origin[0] else -dy

    return [x, y]


def bounds2indices(bounds, origin):
    '''
    Returns the 4 corners of a map relative to the origin
    @params : origin is a [latitude, longitude] object
    @params : bounds is a dictionnary containing south, north, east, west bounds
    '''

    x0 = translate_position([bounds['south'], bounds['west']], origin)[0]
    x1 = translate_position([bounds['south'], bounds['east']], origin)[0]
    y0 = translate_position([bounds['south'], bounds['west']], origin)[1]
    y1 = translate_position([bounds['north'], bounds['west']], origin)[1]

    return x0, x1, y0, y1


def transparent_cmap(original_cmap):

    '''
    Returns a transparent colormap from an original colormap name
    '''

    # Choose colormap
    cmap = cm.get_cmap(original_cmap)

    # Get the colormap colors
    my_cmap = cmap(np.arange(cmap.N))

    # Set alpha
    my_cmap[:, -1] = np.linspace(0, 1, cmap.N)

    return ListedColormap(my_cmap)
