# from .data_views import *
# from .template_views import *
# from .file_views import *

try:
    from .data_views import discover, discover_maps, get_positions, get_sensor_data
    from .data_views import mesonh_box, get_section, update_profiles
    from .data_views import update_cloud_data, wind_data
    from .data_views import get_available_missions, get_mission_parameters
    
    from .template_views import render_template
    from .file_views import download_map, plane_icon, map_tiles, texture, model3D, layer_img
except Exception as e:
    # Have to do this because #@%*&@^*! django is hiding exceptions
   print("# Caught exception #############################################\n    ", e)
   exc_type, exc_obj, exc_tb = sys.exc_info()
   fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
   print(exc_type, fname, exc_tb.tb_lineno,
         end="\n############################################################\n\n\n")
   raise e