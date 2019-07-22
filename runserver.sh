#!/bin/bash

function finish() {
	echo "Killing server"
	exit
}

trap finish SIGINT

echo "Starting server on 0.0.0.0:8000"

cd ./web
gunicorn --timeout=200 --bind 0.0.0.0:8000 IHM.wsgi

