from django.urls import path
from django.views.generic import RedirectView

from . import views

urlpatterns = [
    path('', RedirectView.as_view(url='preview')),
    path('preview/', views.preview, name='preview'),
    path('cross_sections/', views.cross_section, name='cross_sections'),
    path('infos/', views.infos, name='infos'),
]