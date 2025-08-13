import time
from typing import Callable, Awaitable, Any
from fastapi import Request, Response
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
from fastapi.routing import APIRoute

# Metrics
REQUEST_COUNT = Counter(
    'http_requests_total',
    'Total number of HTTP requests',
    ['method', 'endpoint', 'status_code']
)

REQUEST_LATENCY = Histogram(
    'http_request_duration_seconds',
    'HTTP request latency in seconds',
    ['method', 'endpoint']
)

ACTIVE_REQUESTS = Gauge(
    'http_active_requests',
    'Number of active HTTP requests',
    ['method', 'endpoint']
)

# Custom route class for monitoring
class MonitorRoute(APIRoute):
    def get_route_handler(self) -> Callable:
        original_route_handler = super().get_route_handler()

        async def custom_route_handler(request: Request) -> Response:
            method = request.method
            endpoint = request.url.path
            
            # Track active requests
            ACTIVE_REQUESTS.labels(method=method, endpoint=endpoint).inc()
            
            # Track request latency
            start_time = time.time()
            try:
                response = await original_route_handler(request)
                status_code = response.status_code
                return response
            finally:
                # Update metrics
                latency = time.time() - start_time
                REQUEST_LATENCY.labels(method=method, endpoint=endpoint).observe(latency)
                REQUEST_COUNT.labels(method=method, endpoint=endpoint, status_code=status_code).inc()
                ACTIVE_REQUESTS.labels(method=method, endpoint=endpoint).dec()

        return custom_route_handler

# Metrics endpoint
def metrics_endpoint():
    """Expose Prometheus metrics"""
    return Response(
        content=generate_latest(),
        media_type=CONTENT_TYPE_LATEST
    )
