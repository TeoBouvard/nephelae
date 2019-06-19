import pptk
import numpy as np
from netCDF4 import MFDataset

var_time = 'time'        # Time in seconds since 1995-1-1 00:00:00
var_lwc = 'RCT'          # Liquid water content in KG/KG ?
time_index = 0

if __name__ == "__main__":
        # Load file into dataset
    dataset = MFDataset('./data/data.nc')

    #print(dataset.variables[var_lwc])
    for i in range(100):
        lwc = np.where(dataset.variables[var_lwc][i,:,:,:] > 0)
        #np.swapaxes(lwc,2,0)

        v = pptk.viewer(lwc[2][:])
        #v.set(point_size=0.005)