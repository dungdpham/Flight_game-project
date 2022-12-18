import mysql.connector
import random
import math
from geopy import distance
from flask import Flask, request
from flask_cors import CORS
import json

app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'

connection = mysql.connector.connect(
    host='127.0.0.1',
    port=3306,
    database='flight_game',
    user='dbuser',
    password='password',
    autocommit=True
)

@app.route('/icaoinfo/<icao>')
def get_info_from_icao(icao):
    sql = "SELECT ident, airport.name, municipality, country.name, latitude_deg, longitude_deg FROM airport, country "
    sql += "WHERE airport.iso_country=country.iso_country and ident='" + icao + "'"
    cursor = connection.cursor()
    cursor.execute(sql)
    result = cursor.fetchall()
    if cursor.rowcount > 0:
        for row in result:
            response = {
                "icao": row[0],
                "airport": row[1],
                "city": row[2],
                "country": row[3],
                "lat": row[4],
                "lon": row[5]
            }
            return response

@app.route('/random')
def randomized_options():
    args = request.args
    continent = args.get('cont')
    loc = args.get('loc')

    sql = "select ident, airport.name, municipality, country.name, latitude_deg, longitude_deg from airport, country "
    sql += "where airport.iso_country=country.iso_country and type='large_airport' "
    sql += "and airport.continent='" + continent + "' and country.name !='Finland'"
    cursor = connection.cursor()
    cursor.execute(sql)
    result = cursor.fetchall()
    while True:
        city1 = random.choice(result)
        city23_list = []
        for row in result:
            if distance.distance(city1[4:6], row[4:6]).km <= 2000 and row[2] != city1[2]:
                city23_list.append(row)
        if len(city23_list) >= 2:
            city2, city3 = random.sample(city23_list, 2)
            if city2[2] != city3[2]:
                break
    cities = [city1, city2, city3]

    cur_loc = get_info_from_icao(loc)
    coords = (cur_loc['lat'], cur_loc['lon'])
    for city in cities:
        city_update = city + (distance.distance(city[4:6], coords).km, )
        #print(city_update)
        cities[cities.index(city)] = city_update
    cities.sort(key=lambda x:x[-1])

    options = []
    for c in continents:
        if c == continent:
            for city in cities:
                option = {
                    "icao": city[0],
                    "airport": city[1],
                    "city": city[2],
                    "country": city[3],
                    "lat": city[4],
                    "lon": city[5],
                    "ticket": continents[c]['tickets'][cities.index(city)],
                    "earn": continents[c]['earn'][cities.index(city)]
                }
                options.append(option)

    return options



continents = {
    'eu': {
        'tickets': [150, 200, 300],
        'earn': [30, 40, 60]
    },
    'af': {
        'tickets': [600, 800, 1200],
        'earn': [30, 40, 60]
    },
    'as': {
        'tickets': [720, 960, 1440],
        'earn': [36, 48, 72]
    },
    'oc': {
        'tickets': [864, 1152, 1728],
        'earn': [43, 57, 86]
    },
    'sa': {
        'tickets': [621, 828, 1244],
        'earn': [31, 41, 62]
    }
}

#print(randomized_options('as', 'efhk'))

if __name__ == '__main__':
    app.run(use_reloader=True, host='127.0.0.1', port=5000)

