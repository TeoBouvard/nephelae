from django.test import TestCase
from .models import HorizontalCrossSection

hcs = HorizontalCrossSection()

class ModelTests(TestCase):
    
    def test_sanity(self):
        self.assertTrue(True)
    
    def test_hcs_creation(self):
        #print(hcs.altitude_index)
        #print(hcs.time_index)
        self.assertAlmostEqual(hcs.altitude_index,0)
        self.assertAlmostEqual(hcs.time_index,0)
    
    def test_hcs_shape(self):
        test_dict = {
            'time': 144, 
            'VLEV': 160, 
            'W_E_direction': 256, 
            'S_N_direction': 256
            }
        self.assertDictEqual(hcs.get_shape(),test_dict)
    
    def test_hcs_duration(self):
        test_duration = 715
        self.assertAlmostEqual(hcs.time_range(), test_duration)

    
    def test_hcs_altitude_range(self):
        test_range = 3.975
        self.assertAlmostEqual(hcs.altitude_range(), test_range, places=4)

    def test_print_cloud_string(self):
        string_image = hcs.print_cloud_string()
        #print(string_image)
        return True

    def test_altitude(self):
        altitude = hcs.dataset.variables['VLEV'][hcs.altitude_index,0,0]
        print(altitude)
        return True
