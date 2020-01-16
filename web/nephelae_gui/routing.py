from django.conf.urls import url

from .consumers import consumers, aircraft_consumers, debug_consumers

def raw_data_instance(*args, **kwargs):
    return consumers.SensorConsumer(15, *args, **kwargs)

def profiles_instance(*args, **kwargs):
    return consumers.SensorConsumer(10, *args, **kwargs)

websocket_urlpatterns = [

    url('ws/sensor/profiles/', profiles_instance),
    url('ws/sensor/raw_data/', raw_data_instance),
    url(r'^ws/sensor/cloud_data/(?P<id_client>\d+)/$',
        consumers.CloudDataConsumer),
    url('ws/sensor/point/', consumers.PointConsumer),
    url('ws/wind/', consumers.WindConsumer),
    url('ws/status/', aircraft_consumers.StatusConsumer),
    url('ws/mission_upload/', aircraft_consumers.MissionUploadConsumer),
    url('ws/GPS/', aircraft_consumers.GPSConsumer),
    url('ws/debug_tracker/', debug_consumers.DebugTrackerConsumer),
]
