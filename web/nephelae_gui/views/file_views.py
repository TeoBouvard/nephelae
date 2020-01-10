import threading
from pathlib import Path
from PIL import Image
import numpy as np
import io
from matplotlib.colors import hex2color

from django.http import HttpResponse, HttpResponseNotFound

try:
    # from ..models import hypercube, tile_downloader
    from nephelae_gui.models import hypercube, tile_downloader
except Exception as e:
    # Have to do this because #@%*&@^*! django is hiding exceptions
   print("# Caught exception #############################################\n    ", e)
   exc_type, exc_obj, exc_tb = sys.exc_info()
   fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
   print(exc_type, fname, exc_tb.tb_lineno,
         end="\n############################################################\n\n\n")
   raise e

# Render icons for UAVs
def plane_icon(request, index):
    try:
        path = Path('nephelae_gui/img/plane_icons/plane_icon' + str(index) + '.png')
        with open(str(path), 'rb') as f:
            return HttpResponse(f.read(), content_type="image/png")
    except IOError:
        return HttpResponseNotFound()

# Render icons for UAVs
def generate_plane_icon(request, color):
    try:
        # Getting base image for uav icons and using its alpha channel.
        rgb = (255.0*np.array(list(hex2color('#' + color)) + [0.0])).astype('uint8')
        img = Image.open('nephelae_gui/img/plane_icons/plane_icon0.png').convert('RGBA')
        colors = np.array([rgb]*img.width*img.height, dtype='uint8')
        colors[:,3] = np.array(img)[:,:,3].ravel()
        img = Image.fromarray(colors.reshape([img.width, img.height, 4]))

        buf = io.BytesIO()
        img.save(buf, format="PNG")
        buf.seek(0)

        return HttpResponse(buf.read(), content_type="image/png")
    except IOError as e:
        print("Exception generating plane icons :", e)
        return HttpResponseNotFound()


# Render map tiles
def map_tiles(request, z, x, y):
    try:
        path = Path('nephelae_gui/static/map_tiles/', str(z), str(x), str(y) + '.jpg')
        with open(str(path), "rb") as f:
            return HttpResponse(f.read(), content_type="image/jpg")
    except IOError:
        return HttpResponseNotFound()


# Render simulation texture
def texture(request, file_name):
    try:
        path = Path('nephelae_gui/img/textures/', str(file_name))
        with open(str(path), "rb") as f:
            response = HttpResponse(f.read(), content_type="image/jpg")
            return response
    except IOError:
        return HttpResponseNotFound()


# Render UAV 3D model
def model3D(request, file_name):
    try:
        path = Path('nephelae_gui/img/3d_models/', str(file_name))
        with open(str(path), "rb") as f:
            response = HttpResponse(f.read())
            return response
    except IOError:
        return HttpResponseNotFound()


# Render layer image
def layer_img(request, variable_name):

    # Parse request parameters
    query = request.GET

    time_value = float(query.get('time'))
    altitude_value = float(query.get('altitude'))

    thermals_cmap = query.get('thermals_cmap')
    clouds_cmap = query.get('clouds_cmap')
    transparent = query.get('transparent') == 'true'

    id_client = query.get('id')

    map_bounds = {
        'east': float(query.get('map_bounds[east]')),
        'west': float(query.get('map_bounds[west]')),
        'south': float(query.get('map_bounds[south]')),
        'north': float(query.get('map_bounds[north]'))
    }

    origin = [
        float(query.getlist('origin[]')[0]),
        float(query.getlist('origin[]')[1])
    ]

    buf = hypercube.print_horizontal_slice(id_client, variable_name, time_value,
            altitude_value, map_bounds, origin, thermals_cmap, clouds_cmap,
            transparent)
    return HttpResponse(buf.read(), content_type="image/png")
