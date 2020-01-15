import os

try:
    from nephelae_scenario import Scenario

    # Find a way to give this as an argument to the server !
    scenario = Scenario(os.environ['NEPHELAE_CONFIG'])
    scenario.load()
    scenario.start()

    websockets_cloudData_ids = {}

    # Legacy variables. To remove when conversion to scenario is completed
    db = scenario.database

    # Defines displayable samples, to keep for now. Find an alternative to put in scenario
    db_data_tags = ['RCT', 'WT', 'THT'] 

    # TODO fix this
    def on_exit():
        print("Shutting down paparazzi interface... ", end='', flush=True)
        scenario.stop()
        print("Done.", flush=True)
        exit()

except Exception as e:
   import sys
   import os
   # Have to do this because #@%*&@^*! django is hiding exceptions
   print("# Caught exception #############################################\n    ", e, flush=True)
   exc_type, exc_obj, exc_tb = sys.exc_info()
   fname = exc_tb.tb_frame.f_code.co_filename
   print(exc_type, fname, exc_tb.tb_lineno,
         end="\n############################################################\n\n\n", flush=True)
   raise e


