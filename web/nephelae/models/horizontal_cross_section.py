import base64
import io
import urllib

import matplotlib.pyplot as plt
from netCDF4 import MFDataset

var_time = 'time'        # Time in seconds since 1995-1-1 00:00:00
var_altitude = 'VLEV'    # Vertical levels in km ASL
var_upwind = 'WT'        # Upwind in m/s
var_lwc = 'RCT'          # Liquid water content in KG/KG ?

# Load file into dataset
dataset = MFDataset('../../MesoNH/MesoNH.nc')


class HorizontalCrossSection():

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
        return dataset
        
    def get_shape(self):
        keys = [var_time,var_altitude, 'W_E_direction', 'S_N_direction']
        values = [
            len(dataset.variables[var_time][:]),
            len(dataset.variables[var_altitude][:]),
            len(dataset.variables['W_E_direction'][:]),
            len(dataset.variables['S_N_direction'][:])
        ]
        return dict(zip(keys,values))

    # Returns a base64 encoded string containing hcs upwind data
    def print_thermals(self):

        thermals = dataset.variables[var_upwind][self.time_index,self.altitude_index,:,:]

        # Create pyplot image
        plt.imshow(thermals, origin='lower', vmin=self.min_upwind(), vmax=self.max_upwind())
        plt.title('Vertical air speed in m/s')
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
    
    def print_thermals_img(self):
        thermals = dataset.variables[var_upwind][self.time_index, self.altitude_index, :, :]
        plt.imshow(thermals, origin='lower')
        plt.savefig('nephelae/img/thermals.png', format='png') 
    
    def print_clouds(self):
        
        clouds = dataset.variables[var_lwc][self.time_index, self.altitude_index, :,:]

        # Create pyplot image
        plt.imshow(clouds, origin='lower',vmin=0, vmax=self.max_lwc())
        title = 'Liquid Water Content in kg/kg' #at ' + str(int(self.get_altitude())) + 'm ASL'
        plt.title(title)
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
    
    def print_clouds_img(self):
        clouds = dataset.variables[var_lwc][self.time_index,self.altitude_index,:,:]
        plt.imshow(clouds, origin='lower')
        plt.savefig('nephelae/img/clouds.jpg', format='jpg') 
    
    # Get date !in seconds since epoch! from time_index
    def get_date(self):
        return dataset.variables[var_time][self.time_index]

    # Get altitude !in meters! from altitude_index !CHECK THIS METHOD'S CORRECTNESS!
    def get_altitude(self):
        return 1000*dataset.variables[var_altitude][self.altitude_index, 0, 0]

    @staticmethod
    # Compute acquisition duration
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
