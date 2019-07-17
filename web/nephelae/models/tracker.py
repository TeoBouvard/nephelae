import utm
from geopy.distance import distance

from nephelae_mapping.database import DatabasePlayer, NephelaeDataServer

db = DatabasePlayer('/home/arthurdent/Documents/dev/nephelae/nephelae_mapping/tests/output/database02.neph')
db.play(looped=True)

nav_frame = list(utm.to_latlon(db.navFrame['utm_east'], db.navFrame['utm_north'], db.navFrame['utm_zone'], northern=True))


def discover():
    return dict(origin=nav_frame, uavs=db.uavIds)


def track(uav_ids, trail_length):

    data = {}

    for uav_id in uav_ids:

        messages = [entry.data for entry in db.find_entries(['GPS', str(uav_id)], (slice(-trail_length, None), ), lambda entry: entry.data.stamp)]

        data[uav_id] = {
            'heading': messages[-1]['course'],
            'speed': messages[-1]['speed'],
            'time': int(messages[-1]['stamp'] - db.navFrame['stamp'])
        }

        for message in messages:

            position = list(utm.to_latlon(message['utm_east'], message['utm_north'], message['utm_zone'], northern=True))
            position.append(message['alt'])

            frame_position = translate_position(position, nav_frame)
            frame_position.append(message['alt'])

            if 'path' not in data[uav_id]:
                data[uav_id]['path'] = [position]
                data[uav_id]['frame_path'] = [frame_position]
            else:
                data[uav_id]['path'].append(position)
                data[uav_id]['frame_path'].append(frame_position)
    
    return data


def data(uav_ids, trail_length):

    data = dict()

    for uav_id in uav_ids:

        messages = [entry.data for entry in db.find_entries(['SAMPLE', str(uav_id)], (slice(-trail_length, None), ), lambda entry: entry.data.timeStamp)]
        
        for message in messages:

            if uav_id not in data.keys():
                data[uav_id] = dict()
            elif message.variableName not in data[uav_id].keys():
                data[uav_id][message.variableName] = dict(
                    x=[message.timeStamp],
                    y=[message.data[0]],
                )
            else:
                data[uav_id][message.variableName]['x'].append(message.timeStamp)
                data[uav_id][message.variableName]['y'].append(message.data[0])
                
    return data


def translate_position(real_world, origin):
    x = distance(origin, [real_world[0], origin[1]]).meters
    y = distance(origin, [origin[0], real_world[1]]).meters

    return [x, y]
