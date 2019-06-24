import logging
import os
import time

from ivy.std_api import IvyInit, IvyStart, IvyBindMsg, IvyUnBindMsg, IvyStop


class UtmPosition:

    def __init__(self, t, utmX, utmY, utmZ, utmZone, heading):

        self.time    = t
        self.utmX    = utmX
        self.utmY    = utmY
        self.utmZ    = utmZ
        self.utmZone = utmZone
        self.heading = heading # in deg relative to north / clockwise
 
    def __repr__(self):
        # return "UtmPosition()"
        return str(self)
    
    def __str__(self):
        return ("UtmPosition :\n" +
                " time    : " + str(self.time)    + '\n' +
                " utmX    : " + str(self.utmX)    + '\n' +
                " utmY    : " + str(self.utmY)    + '\n' +
                " utmZ    : " + str(self.utmZ)    + '\n' +
                " utmZone : " + str(self.utmZone) + '\n' + 
                " heading : " + str(self.heading) + '\n')

class PprzGpsGrabber:

    def __init__(self, ipp="127.255.255.255:2010"):

        self.ivyIpp = ipp   # ip:port to launch ivybus on
        self.ivyBindId = -1 # ivy messages bind id used to unbind on stop
        self.uavs = {}      # dict : {keys : uav id, values : list(UtmPosition)}

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
        #print(msg)

        # New uav detected
        if uavId not in self.uavs.keys():
            print("Found UAV :", uavId)
            self.uavs[uavId] = []

        self.uavs[uavId].append(UtmPosition(
            float(words[10]) / 1.0e3, # gps time (ms)
            float(words[3])  / 1.0e2, # utmX (cm)
            float(words[4])  / 1.0e2, # utmY (cm)
            float(words[6])  / 1.0e3, # utmZ (mm)
            int(words[11]),           # utmZone
            float(words[5])  / 10.0   # heading
        ))

if __name__ == '__main__':
    p = PprzGpsGrabber()
    p.start()
    starttime=time.time()
    while True:
        print(p.uavs)
        time.sleep(1.0 - ((time.time() - starttime) % 1.0))
