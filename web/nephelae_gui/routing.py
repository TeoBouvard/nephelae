from django.conf.urls import url

from . import consumers

websocket_urlpatterns = [
    url('ws/GPS/', consumers.GPSConsumer),
    url('ws/sensor/', consumers.SensorConsumer),
    url('ws/status/', consumers.StatusConsumer),
]
