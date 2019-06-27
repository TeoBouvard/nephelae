#!/bin/bash
while true; do
  echo "Re-starting server on 0.0.0.0:8000"
  COMMAND="$(nproc)"
  N_WORKERS=$((${COMMAND}))
  cd ./web
  gunicorn --workers=1 --bind 0.0.0.0:8000 IHM.wsgi  
  sleep 2
done
