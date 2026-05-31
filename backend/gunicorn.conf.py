"""
Gunicorn configuration for production (Linux/EC2).
This file is used when starting Gunicorn on the EC2 server.

Start command:
    gunicorn -c gunicorn.conf.py config.wsgi:application

Because this project uses Django Channels (WebSockets via Daphne),
Gunicorn only handles HTTP requests. Daphne handles WebSockets separately.
"""

import multiprocessing

# ─── Binding ────────────────────────────────────────────────
# Listen only on localhost — Nginx will reverse-proxy to this port
bind = "127.0.0.1:8000"

# ─── Workers ─────────────────────────────────────────────────
# Formula: (2 × CPU cores) + 1
# On a t3.micro (1 vCPU) this gives 3 workers
workers = multiprocessing.cpu_count() * 2 + 1

# Worker class: uvicorn workers support ASGI (async Django)
worker_class = "uvicorn.workers.UvicornWorker"

# ─── Timeouts ────────────────────────────────────────────────
timeout = 120           # Kill workers that take longer than 120s
graceful_timeout = 30   # Wait 30s for workers to finish before killing
keepalive = 5           # Seconds to keep idle connections open

# ─── Logging ─────────────────────────────────────────────────
# On EC2, create this directory first: sudo mkdir -p /var/log/gunicorn
accesslog = "/var/log/gunicorn/access.log"
errorlog  = "/var/log/gunicorn/error.log"
loglevel  = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s"'

# ─── Process naming ──────────────────────────────────────────
proc_name = "my_event_project"

# ─── Reload (disable in production) ──────────────────────────
reload = False
