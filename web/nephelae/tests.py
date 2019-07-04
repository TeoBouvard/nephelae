from timeit import default_timer as timer

from django.test import TestCase

class ModelTests(TestCase):
    
    def test_sanity(self):
        self.assertTrue(True)
