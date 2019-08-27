from channels.routing import ProtocolTypeRouter, URLRouter
import nephelae_gui.routing

application = ProtocolTypeRouter({
    'websocket': URLRouter(nephelae_gui.routing.websocket_urlpatterns)
})
