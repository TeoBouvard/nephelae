import os
from netCDF4 import MFDataset

from nephelae.database import DatabasePlayer, NephelaeDataServer

try:
    if 'PPRZ_DB' in os.environ:
        # if PPRZ_DB is defined, do a replay
        db = DatabasePlayer(os.environ['PPRZ_DB'])
        db.play(looped=True)
        def on_exit():
            db.stop()
            exit()
    else:
        # else connect to paparazzi uavs
        db = NephelaeDataServer()
        # print("Enabling database save")
        # db.enable_periodic_save('/home/pnarvor/work/nephelae/data/temp/dt5_01.neph', timerTick=10.0, force=True)
    
    if 'MESO_NH' in os.environ:
        # atm = MFDataset(os.environ['MESO_NH'])
        # Apparenly MFDataset is pissy with several uses of one instance.
        # Several instances on the same files seems to be ok though, go figure...
        atm = os.environ['MESO_NH']
    else:
        print('Environement variable $MESO_NH is not set. Update it in /etc/environment')
        exit()
except Exception as e:
    # Have to do this because #@%*&@^*! django is hiding exceptions
   print("# Caught exception #############################################\n    ", e)
   exc_type, exc_obj, exc_tb = sys.exc_info()
   fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
   print(exc_type, fname, exc_tb.tb_lineno,
         end="\n############################################################\n\n\n")
   raise e


