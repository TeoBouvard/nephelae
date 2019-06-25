#!/bin/bash
while true; do
  echo "Re-starting Django runserver on broadcast"
  cd ./web
  python3 manage.py runserver 0:8000
  sleep 2
done
