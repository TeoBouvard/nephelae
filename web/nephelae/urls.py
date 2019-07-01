from django.urls import path
from django.views.generic import RedirectView

from . import views

urlpatterns = [
    # URL for empty path
    path('', RedirectView.as_view(url='map')),

    # URL for preview page
    path('preview/', views.preview, name='preview'),

    # URL for map page
    path('map/', views.map, name='map'),
    path('map/update/', views.update_map, name='update_map'),
    path('map/tile/<int:z>/<int:x>/<int:y>', views.map_tiles, name='map_tiles'),
    path('map/clouds/<int:z>/<int:x>/<int:y>/<int:altitude>', views.cloud_tiles, name='cloud_tiles'),
    path('map/plane_icon/<int:index>', views.plane_icon, name='plane_icon'),

    # URL for cross_sections page
    path('cross_sections/', views.cross_section, name='cross_sections'),
    
    # URL for infos page
    path('infos/', views.infos, name='infos'),
    
]
