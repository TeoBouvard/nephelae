#! /bin/bash

$PAPARAZZI_HOME/sw/simulator/pprzsim-launch -b 127.255.255.255 -a Microjet_neph_0 -t sim --boot --norc &
$PAPARAZZI_HOME/sw/simulator/pprzsim-launch -b 127.255.255.255 -a Microjet_neph_1 -t sim --boot --norc &
$PAPARAZZI_HOME/sw/simulator/pprzsim-launch -b 127.255.255.255 -a Microjet_neph_2 -t sim --boot --norc &
$PAPARAZZI_HOME/sw/ground_segment/cockpit/gcs -layout large_left_col.xml &
$PAPARAZZI_HOME/sw/ground_segment/tmtc/server -n


