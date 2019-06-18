from django.db import models
import matplotlib.pyplot as plt
import numpy as np
from netCDF4 import MFDataset


class HorizontalCrossSection(models.Model):
    
    dataset = MFDataset('../data/data.nc')
    altitude = models.IntegerField()
    time = models.IntegerField()

    def __init__(self, altitude='0', time='0'):
        self.altitude = altitude
        self.time = time

    def __str__(self):
        shape = self.getShape()
        infos = "Shape : ("
        infos += str(shape['time']) + ', '
        infos += str(shape['VLEV']) + ', '
        infos += str(shape['W_E_direction']) + ', '
        infos += str(shape['S_N_direction'])
        infos += ")"
        return infos
    
    def getShape(self):
        keys = ['time','VLEV', 'W_E_direction', 'S_N_direction']
        values = [
            len(self.dataset.variables['time'][:]),
            len(self.dataset.variables['VLEV'][:]),
            len(self.dataset.variables['W_E_direction'][:]),
            len(self.dataset.variables['S_N_direction'][:])
        ]
        return dict(zip(keys,values))

    def min_time(self):
        return self.dataset.variables['time'][0]
    
    def max_time(self):
        return self.dataset.variables['time'][-1]
    
    def duration(self):
        return self.max_time()-self.min_time()
    
    def min_level(self):
        return np.amin(self.dataset.variables['VLEV'])
    
    def max_level(self):
        return np.amax(self.dataset.variables['VLEV'])
    
    def altitude_range(self):
        return self.max_level()-self.min_level()
    
    def getUpwind(self):
        return self.dataset.variables['WT'][self.time,self.altitude,:,:]

    def printUpwind(self):
        fig = plt.imshow(self.getUpwind(), origin='lower')
        #plt.show()
        return plt
