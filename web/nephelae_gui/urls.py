from django.urls import path
from django.views.generic import RedirectView

from . import views

urlpatterns = [
    # URL for empty path
    path('', RedirectView.as_view(url='commands')),

    # URL for preview page, update requests routed to map update view
    path('preview/', views.render_template, {'template_name': 'preview.html'}, name='preview'),
    path('preview/update/', views.get_sensor_data),

    # URL for map page
    path('map/', views.render_template, {'template_name': 'map.html'}, name='map'),
    path('map/update/', views.get_positions_uavs_map),
    path('map/<str:variable_name>_wind/', views.wind_data),
    path('map/tile/<int:z>/<int:x>/<int:y>', views.map_tiles, name='map_tiles'),
    path('map/plane_icon/<int:index>', views.plane_icon, name='plane_icon'),
    path('map/generated_plane_icon/<str:color>', views.generate_plane_icon, name='generated_plane_icon'),
    path('map/<str:variable_name>_img/', views.layer_img, name='layer_img'),

    # URL for simulation page
    path('simulation/', views.render_template, {'template_name': 'simulation.html'}, name='simulation'),
    path('simulation/update/', views.get_positions),
    path('simulation/textures/<str:file_name>', views.texture),
    path('simulation/models/<str:file_name>', views.model3D),

    # URL for commands page
    path('commands/', views.render_template, {'template_name': 'commands.html'}, name='commands'),
    path('commands/update/', views.get_positions),

    # URL for sections page
    path('sections/', views.render_template, {'template_name': 'sections.html'}, name='sections'),
    path('sections/mesonh_dims/', views.mesonh_box),
    path('sections/uav_state_at_time/', views.get_state_at_time),
    path('sections/map_section/', views.get_section),
    path('sections/center_cloud/', views.get_center_of_horizontal_slice),
    path('sections/contour_cloud/', views.get_contour_of_horizontal_slice),

    # URL for vertical profiles page
    path('profiles/', views.render_template, {'template_name': 'profiles.html'}, name='profiles'),
    path('profiles/update/', views.get_sensor_data),

    # URL for cloud data page
    path('cloud_data/', views.render_template, {'template_name': 'cloud_data.html'}, name='cloud_data'),
    path('cloud_data/update/', views.update_cloud_data),

    # URL for raw data page
    path('raw_data/', views.render_template, {'template_name': 'raw_data.html'}, name='raw_data'),
    path('raw_data/update/', views.get_sensor_data),

    # URL for settings page
    path('settings/', views.render_template, {'template_name': 'settings.html'}, name='settings'),

    # Absolute URLs accessible by every page
    # Return reference frame, list of uav ids, list of data sample tags
    # to be renamed in discover uavs and to be separated from data_discovery
    path('discover/', views.discover),
    # To discover mapping layers available (from a nephelae.mapping.MapServer
    path('discover_maps/', views.discover_maps),

    path('missions/available_missions/', views.get_available_missions),
    path('missions/mission_parameters/<str:mission_type>', views.get_mission_parameters)
]







