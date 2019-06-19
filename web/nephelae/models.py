from django.db import models
import matplotlib.pyplot as plt, mpld3
from matplotlib.backends.backend_agg import FigureCanvasAgg as FigureCanvas
import numpy as np
import io, base64, urllib
from netCDF4 import MFDataset
import json

var_time = 'time'        # Time in seconds since 1995-1-1 00:00:00
var_altitude = 'VLEV'    # Vertical levels in km
var_upwind = 'WT'        # Upwind
var_lwc = 'RCT'          # Liquid water content


class HorizontalCrossSection(models.Model):
    
    # Load file into dataset
    dataset = MFDataset('../data/data.nc')
    altitude_index = models.IntegerField()
    time_index = models.IntegerField()

    # Initialize horizontal cross section with altitude and time
    def __init__(self, altitude_index=0, time_index=0):
        if (altitude_index > self.max_altitude_index()):
            self.altitude_index = self.dataset.variables[var_altitude][-1]
        elif (altitude_index < 0):
            self.altitude_index = 0
        else:
            self.altitude_index = altitude_index
        
        if (time_index > self.max_time_index()):
            self.time_index = self.dataset.variables[var_time][-1]
        elif (time_index < 0):
            self.time_index = 0
        else:
            self.time_index = time_index

    def __str__(self):
        shape = self.getShape()
        infos = "Shape : ("
        infos += str(shape[var_time]) + ', '
        infos += str(shape[var_altitude]) + ', '
        infos += str(shape['W_E_direction']) + ', '
        infos += str(shape['S_N_direction']) + ")"
        return infos
    
    def getShape(self):
        keys = [var_time,var_altitude, 'W_E_direction', 'S_N_direction']
        values = [
            len(self.dataset.variables[var_time][:]),
            len(self.dataset.variables[var_altitude][:]),
            len(self.dataset.variables['W_E_direction'][:]),
            len(self.dataset.variables['S_N_direction'][:])
        ]
        return dict(zip(keys,values))
    
    def getUpwind(self):
        return self.dataset.variables[var_upwind][self.time_index,self.altitude_index,:,:]
    
    def getCloud(self):
        return self.dataset.variables[var_lwc][self.time_index,self.altitude_index,:,:]

    def printUpwind(self):
        image = plt.imshow(self.getUpwind(), origin='lower')
        #plt.show()
        return plt
    
    def printCloudString(self):
        image = plt.imshow(self.getCloud(), origin='lower')
        buf = io.BytesIO()
        plt.savefig(buf, format='jpg')
        buf.seek(0)
        data = base64.b64encode(buf.read())
        string = 'data:image/jpg;base64,' + urllib.parse.quote(data)
        return string
    
    def get_date(self):
        return self.dataset.variables[var_time][self.time_index]

    # Compute acquisition duration
    def min_time(self):
        return self.dataset.variables[var_time][0]
    
    def max_time(self):
        return self.dataset.variables[var_time][-1]

    def time_range(self):
        return (self.max_time() - self.min_time())

    def max_time_index(self):
        return len(self.dataset.variables[var_time]) - 1

    # Compute altitude range
    def min_altitude(self):
        return min(getattr(self.dataset.variables[var_altitude], 'actual_range'))
    
    def max_altitude(self):
        return max(getattr(self.dataset.variables[var_altitude], 'actual_range'))
    
    def altitude_range(self):
        return self.max_altitude()-self.min_altitude()
    
    def max_altitude_index(self):
        return len(self.dataset.variables[var_altitude]) - 1
    
    '''
    # Compute upwind range
    def min_upwind(self):
        return np.amin(self.dataset.variables[var_upwind])
    
    def max_upwind(self):
        return np.amax(self.dataset.variables[var_upwind])
    
    def upwind_range(self):
        return self.max_upwind()-self.min_upwind()
    '''