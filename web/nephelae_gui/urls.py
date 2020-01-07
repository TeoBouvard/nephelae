from django.urls import path
from django.views.generic import RedirectView

try:
    from .views import aircraft_views
    from .views import data_views
    from .views import template_views
    from .views import file_views
    from .views import misc_views

    urlpatterns = [
        # URL for empty path
        path('', RedirectView.as_view(url='commands')),

        # URL for preview page, update requests routed to map update view
        path('preview/', template_views.render_template, {'template_name': 'preview.html'}, name='preview'),
        path('preview/update/', data_views.get_sensor_data),

        # URL for map page
        path('map/', template_views.render_template, {'template_name': 'map.html'}, name='map'),
        path('map/update/', aircraft_views.get_positions_latlong),
        path('map/<str:variable_name>_wind/', data_views.wind_data),
        path('map/tile/<int:z>/<int:x>/<int:y>', file_views.map_tiles, name='map_tiles'),
        path('map/plane_icon/<int:index>', file_views.plane_icon, name='plane_icon'),
        path('map/generated_plane_icon/<str:color>', file_views.generate_plane_icon, name='generated_plane_icon'),
        path('map/<str:variable_name>_img/', file_views.layer_img, name='layer_img'),

        # URL for simulation page (3D web gl page)
        path('simulation/', template_views.render_template, {'template_name': 'simulation.html'}, name='simulation'),
        path('simulation/update/', aircraft_views.get_positions),
        path('simulation/textures/<str:file_name>', file_views.texture),
        path('simulation/models/<str:file_name>', file_views.model3D),

        # URL for commands page
        path('commands/', template_views.render_template, {'template_name': 'commands.html'}, name='commands'),
        path('commands/available_missions/<str:aircraftId>', aircraft_views.get_available_missions),

        # URL for sections page
        path('sections/', template_views.render_template, {'template_name': 'sections.html'}, name='sections'),
        path('sections/mesonh_dims/', data_views.mesonh_box),
        path('sections/uav_state_at_time/', data_views.get_sample_at_time),
        path('sections/map_section/', data_views.get_section),
        path('sections/center_cloud/', data_views.get_center_of_horizontal_slice),
        path('sections/contour_cloud/', data_views.get_contour_of_horizontal_slice),

        # URL for vertical profiles page
        path('profiles/', template_views.render_template, {'template_name': 'profiles.html'}, name='profiles'),
        path('profiles/update/', data_views.get_sensor_data),

        # URL for cloud data page
        path('cloud_data/', template_views.render_template, {'template_name': 'cloud_data.html'}, name='cloud_data'),
        path('cloud_data/update/', data_views.update_cloud_data),

        # URL for raw data page
        path('raw_data/', template_views.render_template, {'template_name': 'raw_data.html'}, name='raw_data'),
        path('raw_data/update/', data_views.get_sensor_data),

        # URL for settings page
        path('settings/', template_views.render_template, {'template_name': 'settings.html'}, name='settings'),

        # Absolute URLs accessible by every page
        # Return reference frame, list of uav ids, list of data sample tags
        # to be renamed in discover uavs and to be separated from data_discovery
        path('discover/', aircraft_views.discover),
        # To discover mapping layers available (from a nephelae.mapping.MapServer
        path('discover_maps/', data_views.discover_maps),

        # path('missions/available_missions/', views.get_available_missions),


        path('latlon_to_local/', misc_views.latlon_to_local)
    ]

except Exception as e:
    # Have to do this because #@%*&@^*! django is hiding exceptions
   print("# Caught exception #############################################\n    ", e)
   exc_type, exc_obj, exc_tb = sys.exc_info()
   fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
   print(exc_type, fname, exc_tb.tb_lineno,
         end="\n############################################################\n\n\n")
   raise e






