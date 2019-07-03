from django.urls import path
from django.views.generic import RedirectView

from . import views

urlpatterns = [
    # URL for empty path
    path('', RedirectView.as_view(url='preview')),

    # URL for preview page, update requests routed to map update view
    path('preview/', views.preview, name='preview'),
    path('preview/update/', views.update_map, name='update_chart'),
    path('preview/box/', views.box, name='update_chart'),

    # URL for map page
    path('map/', views.map, name='map'),
    path('map/update/', views.update_map, name='update_map'),
    path('map/tile/<int:z>/<int:x>/<int:y>', views.map_tiles, name='map_tiles'),
    path('map/plane_icon/<int:index>', views.plane_icon, name='plane_icon'),
    path('map/clouds_img/<int:time>/<int:altitude>', views.clouds_img, name='plane_icon'),

    # URL for cross_sections page
    path('cross_sections/', views.cross_section, name='cross_sections'),
    path('cross_sections/<int:time_ratio>/<int:altitude_ratio>', views.print_img, name='cross_sections'),
    
    # URL for infos page
    path('infos/', views.infos, name='infos'),
    
]
