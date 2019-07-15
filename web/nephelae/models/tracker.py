import utm

from nephelae_mapping.database import NephelaeDataServer

db = NephelaeDataServer.load('/home/arthurdent/Documents/dev/nephelae/nephelae_mapping/tests/output/database01.neph')


def discover():
    return db.uavIds


def track(uav_ids, trail_length):

    data = {}

    for uav_id in uav_ids:

        messages = [entry.data for entry in db.find_entries(['GPS', str(uav_id)], (slice(-trail_length, None), ))]
        #print(len(messages))

        for message in messages:

            position = list(utm.to_latlon(message['utm_east'], message['utm_north'], message['utm_zone'], northern=True))
            position.append(message['alt'])

            if uav_id not in data.keys():
                data[uav_id] = {}

            if 'path' not in data[uav_id]:
                data[uav_id]['path'] = [position]
            else:
                data[uav_id]['path'].append(position)
    
    return data
