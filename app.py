import time
import json
import random
import numpy as np
from flask import Flask
from flask import render_template
from flask import request
from flask import jsonify

def FtoC(f):
    return (5/9.) * (f-32)

def CtoF(c):
    return (c*(9/5.))+32


######### SIMULATION SETTINGS
IntervalSize=10 # in minutes
Intervals=24*60/IntervalSize #Intervals within a day

#cOLD dAY
Touts=np.array( [  5.        ,   4.85648148,   4.71296296,   4.56944444,
         4.42592593,   4.28240741,   4.13888889,   3.9537037 ,
         3.76851852,   3.58333333,   3.39814815,   3.21296296,
         3.02777778,   2.89814815,   2.76851852,   2.63888889,
         2.50925926,   2.37962963,   2.25      ,   2.11111111,
         1.97222222,   1.83333333,   1.69444444,   1.55555556,
         1.41666667,   1.22222222,   1.02777778,   0.83333333,
         0.63888889,   0.44444444,   0.25      ,   0.10648148,
        -0.03703704,  -0.18055556,  -0.32407407,  -0.46759259,
        -0.61111111,  -0.65277778,  -0.69444444,  -0.73611111,
        -0.77777778,  -0.81944444,  -0.86111111,  -0.9537037 ,
        -1.0462963 ,  -1.13888889,  -1.23148148,  -1.32407407,
        -1.41666667,  -1.46759259,  -1.51851852,  -1.56944444,
        -1.62037037,  -1.6712963 ,  -1.72222222,  -1.72222222,
        -1.72222222,  -1.72222222,  -1.72222222,  -1.72222222,
        -1.72222222,  -1.6712963 ,  -1.62037037,  -1.56944444,
        -1.51851852,  -1.46759259,  -1.41666667,  -1.45833333,
        -1.5       ,  -1.54166667,  -1.58333333,  -1.625     ,
        -1.66666667,  -1.71759259,  -1.76851852,  -1.81944444,
        -1.87037037,  -1.9212963 ,  -1.97222222,  -1.55555556,
        -1.13888889,  -0.72222222,  -0.30555556,   0.11111111,
         0.52777778,   1.23148148,   1.93518519,   2.63888889,
         3.34259259,   4.0462963 ,   4.75      ,   5.30092593,
         5.85185185,   6.40277778,   6.9537037 ,   7.50462963,
         8.05555556,   8.4212963 ,   8.78703704,   9.15277778,
         9.51851852,   9.88425926,  10.25      ,  10.53240741,
        10.81481481,  11.09722222,  11.37962963,  11.66203704,
        11.94444444,  12.16666667,  12.38888889,  12.61111111,
        12.83333333,  13.05555556,  13.27777778,  13.3287037 ,
        13.37962963,  13.43055556,  13.48148148,  13.53240741,
        13.58333333,  13.67592593,  13.76851852,  13.86111111,
        13.9537037 ,  14.0462963 ,  14.13888889,  14.13888889,
        14.13888889,  14.13888889,  14.13888889,  14.13888889,
        14.13888889,  14.09722222,  14.05555556,  14.01388889,
        13.97222222,  13.93055556,  13.88888889,  13.56481481,
        13.24074074,  12.91666667,  12.59259259,  12.26851852])

Tins=np.empty(144)
Heatings=np.empty(144)
Coolings=np.empty(144)
Tins[:] = np.NAN
Heatings[:] = np.NAN
Coolings[:] = np.NAN

Seeding=True
## THERMAL MODEL

#TODO add ventilation action?
#Thermal Response
def ThermalResponce(Tin, Tout, SetPointHeating, SetPointCooling, Interval):
        if SetPointHeating >= SetPointCooling:
                print("Action error")
                return nan
        else:
                if Seeding:
                        random.seed(Interval)
                c = [0.01,  0.01, 0.005]
                sigma = 0.00003
                TempOfAirH = 100
                TempOfAirC = 15
                if SetPointHeating>Tin:
                        print("yo")
                        Heating=1
                        Cooling=0
                elif SetPointCooling<Tin:
                        Heating=0
                        Cooling=1
                else:
                        Heating=0
                        Cooling=0
                print(Heating,Cooling)
                return float(Tin) + float(c[0])*(float(TempOfAirH)-float(Tin))*Heating + float(c[1])*(float(TempOfAirC)-float(Tin))*Cooling - float(c[2])*(float(Tin)-float(Tout)) + random.gauss(0, sigma), Heating, Cooling

def Forward(Tin, Interval, SetPointHeating, SetPointCooling):
        Tin, Heating =ThermalResponce(Tin, Touts[Interval-1], SetPointHeating, SetPointCooling, Interval), Cooling =ThermalResponce(Tin, Touts[Interval-1], SetPointHeating, SetPointCooling, Interval)
        if Interval==Intervals:
                Interval=1
        else:
                Interval+=1
        Tout=Touts[Interval-1]
        return Tin, Tout, Interval, Heating, Cooling

def Start():
        TinINIT=22
        Interval=1
        Tin=TinINIT
        Tout=Touts[Interval-1]
        return Tin, Tout, Interval

app = Flask(__name__, static_url_path='')

@app.route('/')
def hey():
    return app.send_static_file('index.html')

@app.route('/sim', methods=['GET','POST'])
def dosim():
    if request.method == 'GET':
        data = {
          "control_interface": [
            {
              "taps_since_last_post": [],
              "type": "heating"
            },
            {
              "taps_since_last_post": [],
              "type": "cooling"
            },
            {
              "taps_since_last_post": [],
              "type": "power"
            },
            {
              "taps_since_last_post": [],
              "type": "timer"
            }
          ],
          "sensors": [
            {
              "action": "cooling",
              "current": 75,
              "setpoint": 73,
              "outside": 76,
              "type": "temperature"
            }
          ],
          "status": [
            {
              "color": "green",
              "level": 100,
              "type": "power"
            },
            {
              "color": "amber",
              "level": 50,
              "type": "timer"
            },
            {
              "color": "green",
              "level": 100,
              "type": "eco"
            }
          ]
        }
        return jsonify(data)
    if request.method == 'POST':
        data = request.json
        print(data)
        current_temperature = FtoC(data['sensors'][0]['current'])
        interval = 1 #1 -> 96; day divided up to 15 min interval
        # TODO: need timestamp from tstat. Need to generate this on the client
        # side because we could be speeding up a simulation.
        cooling_setpoint = FtoC(data['sensors'][0]['setpoint'] + 2)
        heating_setpoint = FtoC(data['sensors'][0]['setpoint'] - 2)
        tin, tout, interval, heating = Forward(current_temperature, interval, heating_setpoint, cooling_setpoint), cooling = Forward(current_temperature, interval, heating_setpoint, cooling_setpoint)
        print('cool',cooling_setpoint,'heat',heating_setpoint)
        print(tin, tout, interval, heating, cooling)
        data['sensors'][0]['current'] = CtoF(tin)
        data['sensors'][0]['outside'] = CtoF(tout)
        num_heating_requests = 0
        num_cooling_requests = 0
        for tap in data['control_interface']:
            if tap['type'] == 'heating':
                num_heating_requests+=len(tap['taps_since_last_post'])
            elif tap['type'] == 'cooling':
                num_cooling_requests+=len(tap['taps_since_last_post'])
        setpoint_diff = num_cooling_requests - num_heating_requests
        setpoint_diff *= 1
        print("diff",setpoint_diff,num_heating_requests,num_cooling_requests)
        if setpoint_diff > 0:
            data['sensors'][0]['action'] = 'heating'
        elif setpoint_diff < 0:
            data['sensors'][0]['action'] = 'cooling'
        data['sensors'][0]['setpoint'] = CtoF(FtoC(data['sensors'][0]['setpoint']) + setpoint_diff)


        print(data)

        data['control_interface'] = [
            {
              "taps_since_last_post": [],
              "type": "heating"
            },
            {
              "taps_since_last_post": [],
              "type": "cooling"
            },
            {
              "taps_since_last_post": [],
              "type": "power"
            },
            {
              "taps_since_last_post": [],
              "type": "timer"
            }
        ]
        return jsonify(data)
