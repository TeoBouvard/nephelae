# Generated by Django 2.2.2 on 2019-06-19 11:06

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('nephelae_gui', '0001_initial'),
    ]

    operations = [
        migrations.RenameField(
            model_name='horizontalcrosssection',
            old_name='altitude',
            new_name='altitude_index',
        ),
        migrations.RenameField(
            model_name='horizontalcrosssection',
            old_name='time',
            new_name='time_index',
        ),
    ]
