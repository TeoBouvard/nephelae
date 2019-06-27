#!/bin/bash
while true; do
  echo "Re-starting server on 0.0.0.0:8000"
  cd ./web
  gunicorn --bind 0.0.0.0:8000 IHM.wsgi  
  sleep 2
done
