try:
    from . import aircraft_views
    from . import data_views

    from .data_views import discover_maps, get_sensor_data
    from .data_views import mesonh_box, get_section
    from .data_views import update_cloud_data, wind_data
    from .data_views import get_available_missions
    from .data_views import latlon_to_local
    from .data_views import get_center_of_horizontal_slice
    from .data_views import get_contour_of_horizontal_slice
    
    from .template_views import render_template
    from .file_views import plane_icon, generate_plane_icon, map_tiles, texture, model3D, layer_img
except Exception as e:
    # Have to do this because #@%*&@^*! django is hiding exceptions
   print("# Caught exception #############################################\n    ", e)
   exc_type, exc_obj, exc_tb = sys.exc_info()
   fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
   print(exc_type, fname, exc_tb.tb_lineno,
         end="\n############################################################\n\n\n")
   raise e
