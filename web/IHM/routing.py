from channels.routing import ProtocolTypeRouter, URLRouter
import nephelae.routing

application = ProtocolTypeRouter({
    'websocket': URLRouter(nephelae.routing.websocket_urlpatterns)
})