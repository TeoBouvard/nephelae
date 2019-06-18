from django.test import TestCase
from .models import HorizontalCrossSection

hcs = HorizontalCrossSection(42,0)

class ModelTests(TestCase):
    
    def test_sanity(self):
        self.assertTrue(True)
    
    def test_hcs_creation(self):
        self.assertAlmostEqual(hcs.altitude,42)
        self.assertAlmostEqual(hcs.time,0)

    def test_hcs_shape(self):
        test_dict = {
            'time': 144, 
            'VLEV': 160, 
            'W_E_direction': 256, 
            'S_N_direction': 256
            }
        self.assertDictEqual(hcs.getShape(),test_dict)
    
    def test_hcs_duration(self):
        test_duration = 715
        self.assertAlmostEqual(hcs.duration(), test_duration)
        #hcs.printUpwind()

    def test_hcs_altitude_range(self):
        test_range = 3.975
        self.assertAlmostEqual(hcs.altitude_range(), test_range)
