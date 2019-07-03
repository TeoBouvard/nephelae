import logging
import math
import os
import time
import utm
#from collections import deque -> maybe later
from pprint import pprint

from geopy.distance import distance
from ivy.std_api import IvyBindMsg, IvyInit, IvyStart, IvyStop, IvyUnBindMsg

close_enough = 0.005 # in kilometers
log_size = 100 # number of past_positions kept in memory

class PprzGpsGrabber:

    def __init__(self, ipp="127.255.255.255:2010"):

        self.ivyIpp = ipp   # ip:port to launch ivybus on
        self.ivyBindId = -1 # ivy messages bind id used to unbind on stop
        self.uavs = {}      # dict {keys : uav id, values : dict {keys : data_name, values : data} }

    def start(self):

        IvyInit("PprzGpsGrabber_" + str(os.getpid()))   # Ivy Agent initialization
        logging.getLogger('Ivy').setLevel(logging.WARN) # set log level to hide INFO stdout messages
        IvyStart(self.ivyIpp)
        self.ivyBindId = IvyBindMsg(lambda agent, msg: self.gps_callback(msg), '(.* GPS .*)')

    def stop(self):
        
        if self.ivyBindId > 0:
            IvyUnBindMsg(self.ivyBindId)
            self.ivyBindId = -1
            IvyStop()

    def gps_callback(self, msg):
        
        words = msg.split(' ')
        uavId = int(words[0])
        m_time = int(words[10]) / 1000
        altitude = int(words[6]) / 1000
        heading = int(words[5]) / 10.0
        zone = int(words[11])
        easting = float(words[3])  / 1.0e2      # utmX (cm)
        northing = float(words[4])  / 1.0e2     # utmY (cm)
        
        position = utm.to_latlon(easting, northing, zone, northern=True)
        #print(msg)

        # New uav detected
        if uavId not in self.uavs.keys():

            self.uavs[uavId] = {
                "time" : m_time,        
                "altitude" : altitude,      
                "heading" :  heading,
                "position" : position,
                "path" : [position],
                "past_longitudes" : [position[1]],
                "past_latitudes" : [position[0]],
                "past_altitudes" : [altitude],
                "log_times" : [m_time],
            }
            
        else:
            self.uavs[uavId].update({
                "time" : m_time,        
                "altitude" : altitude,  
                "heading" : heading,
                "position" : position,
            })

            # Add position to path only if it is far enough from last position
            if(distance(position, self.uavs[uavId]['path'][-1]) > close_enough):
                self.uavs[uavId]['path'].append(position)
                self.uavs[uavId]['past_altitudes'].append(altitude)
                self.uavs[uavId]['past_longitudes'].append(position[1])
                self.uavs[uavId]['past_latitudes'].append(position[0])
                self.uavs[uavId]['log_times'].append(m_time)
                # Delete old positions
                if(len(self.uavs[uavId]['path']) > log_size):
                    self.uavs[uavId]['path'].pop(0)
                    self.uavs[uavId]['past_altitudes'].pop(0)
                    self.uavs[uavId]['past_longitudes'].pop(0)
                    self.uavs[uavId]['past_latitudes'].pop(0)
                    self.uavs[uavId]['log_times'].pop(0)
    


if __name__ == '__main__':
    p = PprzGpsGrabber()
    p.start()
    starttime=time.time()
    while True:
        pprint(p.uavs)
        time.sleep(1.0 - ((time.time() - starttime) % 1.0))
