import asyncio
import math
import os
import pathlib

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
    y = -(0.5 * math.log((1 + math.sin(math.radians(lat))) / (1 - math.sin(math.radians(lat)))) / math.pi - 1) * 256 * 2 ** (z - 1)
    return x, y


def latlon2xy(z, lat, lon):
    x, y = latlon2px(z, lat, lon)
    x = int(x / 256)
    y = int(y / 256)
    return x, y


async def download_tiles(z_min, z_max, lat_north, lat_south, lon_west, lon_east):

    connector = aiohttp.TCPConnector(limit=40)
    total_images = 0
    already_exists = 0
    saved_images = 0

    async with aiohttp.ClientSession(connector=connector, headers=headers) as client:

        for z in range(z_min, z_max):

            tasks = []

            start_x, start_y = latlon2xy(z, lat_north, lon_west)
            stop_x, stop_y = latlon2xy(z, lat_south, lon_east)

            #print("x range for zoom ", z, " : ", start_x, stop_x)
            #print("y range for 1000zoom ", z, " : ", start_y, stop_y)

            for x in range(start_x-1, stop_x+1):
                for y in range(start_y-1, stop_y+1):
                    
                    dir_path = pathlib.Path(__file__).parent.parent / pathlib.Path("static/map_tiles/%d/%d" % (z, x))
                    filename = pathlib.Path(dir_path, str(y) + ".jpg")
                    total_images += 1

                    if not os.path.exists(filename):
                        pathlib.Path.mkdir(dir_path, parents=True, exist_ok=True)
                        task = asyncio.ensure_future(fetch(client, filename, z, x, y))
                        tasks.append(task)
                    else:
                        already_exists += 1
        
            print("Sending requests for zoom level", z, "...")

            # await list comprehensions not supported in Python 3.5
            #responses = [await r for r in tqdm(asyncio.as_completed(tasks), total=len(tasks))
            responses = []
            for task in tqdm(asyncio.as_completed(tasks)):
                response = await task
                responses.append(response)

            found_responses = [r for r in responses if r is not None]

            print("Writing images to disk ...")

            for response in found_responses:
                # open requires a string in pyton 3.5, not path
                f = open(str(response['filename']), 'wb')
                f.write(response['image'])
                saved_images += 1
                f.close()
            
            #print(total_images, "images in this area")
            #print(already_exists, "images already exist")
            #print(len(responses) - len(found_responses), "images were not found (probably normal)")
    print(saved_images, "images saved")


async def fetch(client, filename, z, x, y):

    query = {
        "layer": "GEOGRAPHICALGRIDSYSTEMS.MAPS",
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


def dl(map_bounds):

    zoom_min, zoom_max = 6, 19
    lat_north = map_bounds['north']
    lat_south = map_bounds['south']
    lon_west = map_bounds['west']
    lon_east = map_bounds['east']

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(download_tiles(zoom_min, zoom_max, lat_north, lat_south, lon_west, lon_east))
    loop.close()


if __name__ == "__main__":

    zoom_min, zoom_max = 5, 12
    lat_north, lon_east = 44, 4
    lat_south, lon_west = 42, 0

    loop = asyncio.get_event_loop()
    loop.run_until_complete(download_tiles(zoom_min, zoom_max, lat_north, lat_south, lon_west, lon_east))
    loop.close()
