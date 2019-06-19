from django.urls import path
from django.views.generic import RedirectView
from . import views


urlpatterns = [
    path('', RedirectView.as_view(url='preview')),
    path('preview/', views.preview, name='preview'),
    path('cross_sections/', views.cross_section, name='cross_sections'),
    path('cross_sections/clouds.jpg', views.display_clouds),
    path('cross_sections/thermals.jpg', views.display_thermals),
    path('infos/', views.infos, name='infos'),
]
