#! /usr/bin/python3

import os
import time
import numpy as np
import matplotlib.pyplot as plt
from   matplotlib import animation

from netCDF4 import MFDataset

def update_ticks_labelXY(ax):
    newLabels = []
    for tick in ax.get_xticks():
        if tick < 0 or tick >= atmShape.x:
            newLabels.append(str(0.0))
        else:
            newLabels.append(str(atm.variables['W_E_direction'][tick]))
    ax.set_xticklabels(newLabels)
    newLabels = []
    for tick in ax.get_yticks():
        if tick < 0 or tick >= atmShape.y:
            newLabels.append(str(0.0))
        else:
            newLabels.append(str(atm.variables['S_N_direction'][tick]))
    ax.set_yticklabels(newLabels)

def update_ticks_labelXZ(ax):
    newLabels = []
    for tick in ax.get_xticks():
        if tick < 0 or tick >= atmShape.x:
            newLabels.append(str(0.0))
        else:
            newLabels.append(str(atm.variables['W_E_direction'][tick]))
    ax.set_xticklabels(newLabels)
    newLabels = []
    for tick in ax.get_yticks():
        if tick < 0 or tick >= atmShape.z:
            newLabels.append(str(0.0))
        else:
            newLabels.append(str(atm.variables['VLEV'][tick]))
    ax.set_yticklabels(newLabels)


atm = MFDataset('/Users/arthurdent/Documents/dev/nephelae/data/data.nc')

atmShape = type('AtmShape', (), {})()
atmShape.t = len(atm.variables['time'][:])
atmShape.z = len(atm.variables['VLEV'][:,0,0])
atmShape.x = len(atm.variables['W_E_direction'][:])
atmShape.y = len(atm.variables['S_N_direction'][:])

print("Shape : (", atmShape.t, atmShape.z, atmShape.x, atmShape.y, ")")

var0 = 'RCT'
# var1 = 'UT'     # WE wind (?)
# var1 = 'VT'     # SN wind (?)
var1 = 'WT'     # vertical wind
# var1 = 'TKET'   # Turbulent kinetic energy
# var1 = 'PABST'  # Absolute pressure
# var1 = 'RVT'    # Vapor mixing ratio
# var1 = 'RRT'    # Rain mixing ratio
# var1 = 'SVT001' # User data (?)
# var1 = 'SVT002' # User data (?)
# var1 = 'SVT003'  # User data (?)

z0 = 44
y0 = 175
# y0 = 25
rctTh = 1e-4

print('Started !')

fig, axes = plt.subplots(2,2, sharex=True)
varDisp0 = axes[0][0].imshow(atm.variables[var0][0,z0,:,:])
axes[0][0].invert_yaxis()
varDisp1 = axes[0][1].imshow(atm.variables[var1][0,z0,:,:])
axes[0][1].invert_yaxis()

varDisp2 = axes[1][0].imshow(atm.variables[var0][0,:,:,y0])
axes[1][0].invert_yaxis()
varDisp3 = axes[1][1].imshow(atm.variables[var1][0,:,:,y0])
axes[1][1].invert_yaxis()

t0 = atm.variables['time'][0]
tStart = -1

tStart = time.time()
oldData = [atm.variables[var0][0,z0,:,:],
           atm.variables[var1][0,z0,:,:],
           atm.variables[var0][0,:,y0,:],
           atm.variables[var1][0,:,y0,:]]
oldIndex = 0

newData = [atm.variables[var0][1,z0,:, :],
           atm.variables[var1][1,z0,:,:],
           atm.variables[var0][1,:,y0,:],
           atm.variables[var1][1,:,y0,:]]
newIndex = 1
def init():

    varDisp0.set_data(atm.variables[var0][0,z0,:,:])
    varDisp1.set_data(atm.variables[var1][0,z0,:,:])
    varDisp2.set_data(atm.variables[var0][0,:,y0,:])
    varDisp3.set_data(atm.variables[var1][0,:,y0,:])

    axes[0][0].plot([0, atmShape.x -1 ], [y0, y0])
    axes[0][1].plot([0, atmShape.x -1 ], [y0, y0])
    axes[1][0].plot([0, atmShape.x -1 ], [z0, z0])
    axes[1][1].plot([0, atmShape.x -1 ], [z0, z0])

def update(i):

    global oldIndex
    global newIndex
    global oldData
    global newData
    global tStart

    index = i % atmShape.t
    varDisp0.set_data(atm.variables[var0][index,z0,:,:])
    varDisp1.set_data(atm.variables[var1][index,z0,:,:])
    varDisp2.set_data(atm.variables[var0][index,:,y0,:])
    varDisp3.set_data(atm.variables[var1][index,:,y0,:])

anim = animation.FuncAnimation(
    fig,
    update,
    init_func=init,
    frames=atmShape.x*atmShape.y,
    interval = 500)

plt.show(block=False)
