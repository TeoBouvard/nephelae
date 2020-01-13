from django.conf.urls import url

from . import consumers

def raw_data_instance(*args, **kwargs):
    return consumers.SensorConsumer(15, *args, **kwargs)

def profiles_instance(*args, **kwargs):
    return consumers.SensorConsumer(10, *args, **kwargs)

websocket_urlpatterns = [
    url('ws/GPS/', consumers.GPSConsumer),
    url('ws/mission_upload/', consumers.MissionUploadConsumer),
    url('ws/sensor/profiles/', profiles_instance),
    url('ws/sensor/raw_data/', raw_data_instance),
    url('ws/status/', consumers.StatusConsumer),
    url(r'^ws/sensor/cloud_data/(?P<id_client>\d+)/$',
        consumers.CloudDataConsumer),
    url(r'^ws/sensor/point/(?P<id_client>\d+)/$', consumers.PointConsumer),
]
