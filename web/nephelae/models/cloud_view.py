import os
import pickle

import numpy as np
import pptk
from netCDF4 import MFDataset

var_time = 'time'        # Time in seconds since 1995-1-1 00:00:00
var_lwc = 'RCT'          # Liquid water content in KG/KG ?
var_altitude = 'VLEV'
cloud_threshold = 10**-5

if 'MESO_NH' in os.environ :
    dataset = MFDataset(os.environ['MESO_NH'])
else :
    print('Environement variable $MESO_NH is not set. Update it in /etc/environment')
    exit()

def save_pickle(array):
    print('starting to save pickle ...')
    with open('points_cloud.pickle', 'wb') as handle:
       pickle.dump(array, handle, protocol=pickle.HIGHEST_PROTOCOL)
    print('pickle saved')

def load_pickle():
    with open('points_cloud.pickle', 'rb') as handle:
        return pickle.load(handle)

def create_points_cloud(time_index):
    
    points = [[0,0,0]]
        
    # Compute altitudes having clouds
    cloud_altitudes = np.where(dataset.variables[var_lwc][time_index,:,:,:] > cloud_threshold)[0]
    cloud_altitudes = list(set(cloud_altitudes))

    for altitude_index in cloud_altitudes:
        altitude = int(dataset.variables[var_altitude][altitude_index,0,0])

        #Compute positions having clouds
        cloud_positions = np.where(dataset.variables[var_lwc][time_index,altitude_index,:,:] > cloud_threshold)
        x_cloud_positions = cloud_positions[0] + cloud_altitudes[0]
        y_cloud_positions = cloud_positions[1] + cloud_altitudes[0]

        for i in range(len(x_cloud_positions)):
            points.append([x_cloud_positions[i],y_cloud_positions[i],altitude_index])

    return points
            
if __name__ == "__main__":

    #lwc = create_points_cloud(0)
    #save_pickle(lwc)
    #lwc = load_pickle()

    points = create_points_cloud(0)
    height = [position[2] for position in points]


    v = pptk.viewer(points, height)
    v.color_map('gray',scale=[10,65])
    v.set(point_size=0.8)

    poses = []
    poses.append([128, 128, 25, 0 * np.pi/2, np.pi/4, 500])
    poses.append([128, 128, 25, 1 * np.pi/2, np.pi/4, 500])
    poses.append([128, 128, 25, 2 * np.pi/2, np.pi/4, 500])
    poses.append([128, 128, 25, 3 * np.pi/2, np.pi/4, 500])
    poses.append([128, 128, 25, 4 * np.pi/2, np.pi/4, 500])
    #v.play(poses, 2 * np.arange(5), repeat=True, interp='linear')
