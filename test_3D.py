import pickle

import numpy as np
import pptk
from netCDF4 import MFDataset

var_time = 'time'        # Time in seconds since 1995-1-1 00:00:00
var_lwc = 'RCT'          # Liquid water content in KG/KG ?
var_altitude = 'VLEV'    # Vertical levels in km ASL

# Load file into dataset
dataset = MFDataset('./data/data.nc')

def save_pickle(array):
    print('starting to save pickle ...')
    with open('points_cloud.pickle', 'wb') as handle:
       pickle.dump(array, handle, protocol=pickle.HIGHEST_PROTOCOL)
    print('pickle saved')

def load_pickle():
    with open('points_cloud.pickle', 'rb') as handle:
        return pickle.load(handle)

def create_points_cloud(time_index):
    
    points = []
        
    # Compute altitudes having clouds
    cloud_altitudes = np.where(dataset.variables[var_lwc][time_index,:,:,:] > 0)[0]
    cloud_altitudes = list(set(cloud_altitudes))

    for altitude_index in cloud_altitudes:
        altitude = int(dataset.variables[var_altitude][altitude_index,0,0])

        #Compute positions having clouds
        cloud_positions = np.where(dataset.variables[var_lwc][time_index,altitude_index,:,:] > 0)
        x_cloud_positions = cloud_positions[0]
        y_cloud_positions = cloud_positions[1]

        for i in range(len(x_cloud_positions)):
            points.append([x_cloud_positions[i],y_cloud_positions[i],altitude_index])

    return points
            
if __name__ == "__main__":

    #lwc = create_points_cloud(0)
    #save_pickle(lwc)
    #lwc = load_pickle()

    
    for i in range(2):
        lwc = create_points_cloud(i)
        height = [position[2] for position in lwc]
        v = pptk.viewer(lwc)
        v.color_map('gray')
        v.attributes(height)
        v.set(point_size=1)
