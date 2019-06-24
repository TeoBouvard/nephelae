#!/bin/bash
#sudo apt-get update
sudo apt-get -y install git python3-pip python3-venv

rm -rf nephelae
git clone https://github.com/TeoBouvard/nephelae.git

cd nephelae
python3 -m venv virtual_env
source virtual_env/bin/activate
pip3 install wheel
pip3 install -r requirements.txt

cd web
source runserver.sh
deactivate

