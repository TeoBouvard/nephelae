import asyncio
import math
import os

import aiohttp
from tqdm import tqdm

key = "an7nvfzojv5wa96dsga5nk8w"
url = "https://wxs.ign.fr/" + key + "/geoportail/wmts?"

headers = {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36',
    'DNT': '1'
}


# Utility methods
def latlon2px(z, lat, lon):
    x = 2 ** z * (lon + 180) / 360 * 256
    y = -(0.5 * math.log((1 + math.sin(math.radians(lat))) /
                         (1 - math.sin(math.radians(lat)))) / math.pi - 1) * 256 * 2 ** (z - 1)
    return x, y


def latlon2xy(z, lat, lon):
    x, y = latlon2px(z, lat, lon)
    x = int(x / 256)
    y = int(y / 256)
    return x, y


async def download_tiles(z_min, z_max, lat_north, lat_south, lon_west, lon_east):

    connector = aiohttp.TCPConnector(limit=30)
    total_images = 0
    already_exists = 0

    async with aiohttp.ClientSession(connector=connector, headers=headers) as client:

        for z in range(z_min, z_max):

            tasks = []

            start_x, start_y = latlon2xy(z, lat_north, lon_west)
            stop_x, stop_y = latlon2xy(z, lat_south, lon_east)

            #print("x range for zoom ", z, " : ", start_x, stop_x)
            #print("y range for 1000zoom ", z, " : ", start_y, stop_y)

            if z < 12:
                start_x -= 1
                start_y -= 1
                stop_x += 1
                stop_y += 1

            for x in range(start_x, stop_x):
                for y in range(start_y, stop_y):

                    filename = "output_p/%d_%d_%d.jpg" % (z, x, y)
                    total_images += 1

                    if not os.path.exists(filename):
                        task = asyncio.ensure_future(fetch(client, filename, z, x, y))
                        tasks.append(task)
                    else:
                        already_exists += 1
        
            print("Sending requests for zoom level", z, "...")

            responses = [await r for r in tqdm(asyncio.as_completed(tasks), total=len(tasks))]
            found_responses = [r for r in responses if r is not None]
            #responses = await asyncio.gather(*tasks)

            print("Writing images to disk ...")

            for response in tqdm(found_responses):
                f = open(response['filename'], 'wb')
                f.write(response['image'])
                f.close()
            
            print(total_images, "images in this area")
            print(already_exists, "images already exist")
            print(len(responses) - len(found_responses), "images were not found (probably normal)")
            print(len(found_responses), "images will be saved")


async def fetch(client, filename, z, x, y):

    query = {
        "layer": "GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN25TOUR.CV",
        "style": "normal",
        "tilematrixset": "PM",
        "Service": "WMTS",
        "Request": "GetTile",
        "Version": "1.0.0",
        "Format": "image/jpeg",
        "TileMatrix": z,
        "TileCol": x,
        "TileRow": y
    }

    async with client.get(url, params=query) as r:

        if r.status == 200:
            image = await r.read()
            return dict(image=image, filename=filename)
        else:
            pass


# Main
if __name__ == "__main__":

    zoom_min, zoom_max = 11, 16
    lat_north, lon_east = 44, 4
    lat_south, lon_west = 42, 0

    loop = asyncio.get_event_loop()
    loop.run_until_complete(download_tiles(zoom_min, zoom_max, lat_north, lat_south, lon_west, lon_east))
    loop.close()
