from django.urls import path
from django.views.generic import RedirectView

from . import views

urlpatterns = [
    path('', RedirectView.as_view(url='preview')),

    path('preview/', views.preview, name='preview'),

    path('map/', views.map, name='map'),
    path('map/update/', views.update_map, name='update_map'),
    path('map/drones/', views.get_drones, name='get_drones'),


    path('cross_sections/', views.cross_section, name='cross_sections'),
    
    path('infos/', views.infos, name='infos'),

    path('img/plane_icon.png', views.img, name='img'),
]
