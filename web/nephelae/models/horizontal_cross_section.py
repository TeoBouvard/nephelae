import base64
import io
import urllib
import os

import matplotlib.pyplot as plt
from netCDF4 import MFDataset

var_time = 'time'        # Time in seconds since 1995-1-1 00:00:00
var_altitude = 'VLEV'    # Vertical levels in km ASL
var_upwind = 'WT'        # Upwind in m/s
var_lwc = 'RCT'          # Liquid water content in KG/KG ?

if 'MESO_NH' in os.environ :
    dataset = MFDataset(os.environ['MESO_NH'])
else :
    print('Environement variable $MESO_NH is not set. Update it in /etc/environment')
    exit()


class HorizontalCrossSection:

    # Initialize horizontal cross section with altitude and time
    def __init__(self, altitude_index=0, time_index=0):
        if (altitude_index > self.max_altitude_index()):
            self.altitude_index = dataset.variables[var_altitude][-1]
        elif (altitude_index < 0):
            self.altitude_index = 0
        else:
            self.altitude_index = altitude_index
        
        if (time_index > self.max_time_index()):
            self.time_index = dataset.variables[var_time][-1]
        elif (time_index < 0):
            self.time_index = 0
        else:
            self.time_index = time_index

    def __str__(self):
        infos = 'Horizontal cross section | altitude : '
        infos += str(self.altitude_index) + '/' + str(self.max_altitude_index())
        infos += ' , time : '
        infos += str(self.time_index) + '/' + str(self.max_time_index())
        return infos
        
       
    # Returns a base64 encoded string containing hcs upwind data
    def print_thermals(self):

        thermals = self.get_slice(var_upwind)

        # Create pyplot image
        plt.imshow(thermals, origin='lower', vmin=self.min_upwind(), vmax=self.max_upwind())
        plt.title('Vertical air speed in m/s')
        plt.set_cmap('viridis')
        plt.colorbar()

        # Write image to buffer
        buf = io.BytesIO()
        plt.savefig(buf, format='png')
        plt.close()

        # Encode buffer in base64 string
        buf.seek(0)
        data = base64.b64encode(buf.read())
        buf.close()
        string = 'data:image/png;base64,' + urllib.parse.quote(data)

        return string
    
    
    def print_clouds(self):
        
        clouds = dataset.variables[var_lwc][self.time_index, self.altitude_index, :,:]

        # Create pyplot image
        plt.imshow(clouds, origin='lower',vmin=0, vmax=self.max_lwc())
        title = 'Liquid Water Content in kg/kg' #at ' + str(int(self.get_altitude())) + 'm ASL'
        plt.title(title)
        plt.set_cmap('viridis')
        plt.colorbar()

        # Write image to buffer
        buf = io.BytesIO()
        plt.savefig(buf, format='png')
        plt.close()

        # Encode buffer in base64 string
        buf.seek(0)
        data = base64.b64encode(buf.read())
        buf.close()
        string = 'data:image/jpg;base64,' + urllib.parse.quote(data)

        return string
    

    def get_slice(self, dimension, x1=None, x2=None, y1=None, y2=None):
        return dataset.variables[dimension][self.time_index, self.altitude_index, x1:x2, y1:y2]


    # Get date !in seconds since epoch! from time_index
    def get_seconds(self):
        return dataset.variables[var_time][self.time_index]
    

    # Get altitude !in meters! from altitude_index !CHECK THIS METHOD'S CORRECTNESS!
    def get_altitude(self):
        return 1000*dataset.variables[var_altitude][self.altitude_index, 0, 0]

    @staticmethod
    # Compute acquisition duration in seconds
    def time_range():
        return (dataset.variables[var_time][-1] - dataset.variables[var_time][0])

    @staticmethod
    def max_time_index():
        return len(dataset.variables[var_time]) - 1

    @staticmethod
    # Compute altitude range
    def altitude_range():
        return max(getattr(dataset.variables[var_altitude], 'actual_range'))-min(getattr(dataset.variables[var_altitude], 'actual_range'))
    
    @staticmethod
    def max_altitude_index():
        return len(dataset.variables[var_altitude]) - 1
    
    @staticmethod
    # Compute max upwind to fix plot colorbar
    def max_upwind():
        return max(getattr(dataset.variables[var_upwind], 'actual_range'))

    @staticmethod
    # Compute min upwind to fix plot colorbar
    def min_upwind():
        return min(getattr(dataset.variables[var_upwind], 'actual_range'))

    @staticmethod
    # Compute max LWC to fix plot colorbar
    def max_lwc():
        return max(getattr(dataset.variables[var_lwc], 'actual_range'))
