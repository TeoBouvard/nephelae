from django.db import models
import matplotlib.pyplot as plt, mpld3
import numpy as np
import io, base64, urllib
from netCDF4 import MFDataset

var_time = 'time'        # Time in seconds since 1995-1-1 00:00:00
var_altitude = 'VLEV'    # Vertical levels in km ASL
var_upwind = 'WT'        # Upwind in m/s
var_lwc = 'RCT'          # Liquid water content in KG/KG ?


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
        shape = self.get_shape()
        infos = "Shape : ("
        infos += str(shape[var_time]) + ', '
        infos += str(shape[var_altitude]) + ', '
        infos += str(shape['W_E_direction']) + ', '
        infos += str(shape['S_N_direction']) + ")"
        return infos
    
    def get_shape(self):
        keys = [var_time,var_altitude, 'W_E_direction', 'S_N_direction']
        values = [
            len(self.dataset.variables[var_time][:]),
            len(self.dataset.variables[var_altitude][:]),
            len(self.dataset.variables['W_E_direction'][:]),
            len(self.dataset.variables['S_N_direction'][:])
        ]
        return dict(zip(keys,values))

    # Returns a base64 encoded string containing hcs upwind data
    def print_thermals(self):
        thermals = self.dataset.variables[var_upwind][self.time_index,self.altitude_index,:,:]
        image = plt.imshow(thermals, origin='lower')
        buf = io.BytesIO()
        plt.savefig(buf, format='jpg')
        buf.seek(0)
        data = base64.b64encode(buf.read())
        string = 'data:image/jpg;base64,' + urllib.parse.quote(data)
        return string
    
    def print_thermals_img(self):
        thermals = self.dataset.variables[var_upwind][self.time_index,self.altitude_index,:,:]
        image = plt.imshow(thermals, origin='lower')
        plt.savefig('nephelae/img/thermals.jpg', format='jpg') 
    
    def print_clouds(self):
        clouds = self.dataset.variables[var_lwc][self.time_index,self.altitude_index,:,:]
        image = plt.imshow(clouds, origin='lower')
        buf = io.BytesIO()
        plt.savefig(buf, format='jpg')
        buf.seek(0)
        data = base64.b64encode(buf.read())
        string = 'data:image/jpg;base64,' + urllib.parse.quote(data)
        return string
    
    def print_clouds_img(self):
        clouds = self.dataset.variables[var_lwc][self.time_index,self.altitude_index,:,:]
        image = plt.imshow(clouds, origin='lower')
        plt.savefig('nephelae/img/clouds.jpg', format='jpg') 
    
    # Get date !in seconds since epoch! from time_index
    def get_date(self):
        return self.dataset.variables[var_time][self.time_index]

    # Get altitude !in meters! from altitude_index !CHECK THIS METHOD'S CORRECTNESS!
    def get_altitude(self):
        return 1000*self.dataset.variables[var_altitude][self.altitude_index, 0, 0]

    # Compute acquisition duration
    def time_range(self):
        return (self.dataset.variables[var_time][-1] - self.dataset.variables[var_time][0])

    def max_time_index(self):
        return len(self.dataset.variables[var_time]) - 1

    # Compute altitude range
    def altitude_range(self):
        return max(getattr(self.dataset.variables[var_altitude], 'actual_range'))-min(getattr(self.dataset.variables[var_altitude], 'actual_range'))
    
    def max_altitude_index(self):
        return len(self.dataset.variables[var_altitude]) - 1
    