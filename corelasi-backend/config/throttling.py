from rest_framework.settings import api_settings
from rest_framework.throttling import ScopedRateThrottle


class RuntimeScopedRateThrottle(ScopedRateThrottle):
    def get_rate(self):
        if not getattr(self, "scope", None):
            return None
        return api_settings.DEFAULT_THROTTLE_RATES.get(self.scope)
