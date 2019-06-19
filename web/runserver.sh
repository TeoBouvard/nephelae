#!/bin/bash
while true; do
  echo "Re-starting Django runserver"
  python3 manage.py runserver
  sleep 2
done