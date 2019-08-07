from django.urls import path
from django.views.generic import RedirectView

from . import views

urlpatterns = [
    # URL for empty path
    path('', RedirectView.as_view(url='commands')),

    # URL for preview page, update requests routed to map update view
    path('preview/', views.preview, name='preview'),
    path('preview/discover/', views.discover),
    path('preview/update/', views.get_sensor_data),

    # URL for map page
    path('map/', views.map, name='map'),
    path('map/discover/', views.discover),
    path('map/update/', views.get_positions),
    path('map/dl_map/', views.download_map),
    path('map/box/', views.mesonh_box),
    path('map/wind/', views.wind_data),
    path('map/tile/<int:z>/<int:x>/<int:y>', views.map_tiles, name='map_tiles'),
    path('map/plane_icon/<int:index>', views.plane_icon, name='plane_icon'),
    path('map/<str:variable_name>_img/', views.layer_img, name='layer_img'),

    # URL for simulation page
    path('simulation/', views.simulation, name='simulation'),
    path('simulation/discover/', views.discover),
    path('simulation/update/', views.get_positions),
    path('simulation/textures/<str:file_name>', views.texture),
    path('simulation/models/<str:file_name>', views.model3D),

    # URL for commands page
    path('commands/', views.commands, name='commands'),
    path('commands/discover/', views.discover),
    path('commands/update/', views.get_positions),

    # URL for sections page
    path('sections/', views.sections, name='sections'),
    path('sections/discover/', views.discover),
    path('sections/box/', views.mesonh_box),
    path('sections/update/', views.get_section),

    # URL for vertical profiles page
    path('profiles/', views.profiles, name='profiles'),
    path('profiles/update/', views.update_profiles),

    # URL for cloud data page
    path('cloud_data/', views.cloud_data, name='cloud_data'),
    path('cloud_data/update/', views.update_cloud_data),

    # URL for raw data page
    path('raw_data/', views.raw_data, name='raw_data'),
    path('raw_data/update/', views.get_sensor_data),
    path('raw_data/discover/', views.discover),

    # URL for settings page
    path('settings/', views.settings, name='settings'),
]
