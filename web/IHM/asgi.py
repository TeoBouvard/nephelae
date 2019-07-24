"""
ASGI entrypoint. Configures Django and then runs the application
defined in the ASGI_APPLICATION setting.
"""

import os
import django
from channels.routing import get_default_application, ProtocolTypeRouter

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "IHM.settings")
django.setup()
#application = get_default_application()

application = ProtocolTypeRouter({})
