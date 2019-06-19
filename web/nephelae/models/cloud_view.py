from django.db import models
import pptk
from netCDF4 import MFDataset

var_time = 'time'        # Time in seconds since 1995-1-1 00:00:00
var_lwc = 'RCT'          # Liquid water content in KG/KG ?


class CloudView(models.Model):
    
    key = models.IntegerField()

    #dataset = MFDataset('../data/data.nc')

    #xyz = dataset.variables[var_lwc][0,0,:,:]
    #v = pptk.viewer(xyz)
    #v.set(point_size=0.005)