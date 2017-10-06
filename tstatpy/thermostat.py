#!/usr/bin/env python
import math
from simulation import Simulation
import matplotlib
matplotlib.use('TkAgg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np

# TODO: add fans:
# - fan runs for 5 min after cooling turns off
# - fan is on for minimum 5 min
# - smart recovery:
#   - learn the slopes for heating/cooling
#   - requires building schedule into python simulation

# TODO:
# Similarity based approach:
# - for now, we assume that we don't get the modalities for a day until after the day has happened
# - what this means is we have a temperature setpoint schedule for past days, along with the accompanying modality schedule
# - similarity based approach finds similar days using setpoint schedule, then retrieves the corresponding set of modality
#   schedules for those similar days, then can vote among upcoming modalities to then choose the most likely modality and therefore associated setpoint schedule
# - always store data using current time; accounting for DST will happen when we store the data; phone will inform tstat when DSt happens

# CONSTRAINTS
MAX_HSP = 70
MIN_HSP = 50

MAX_CSP = 90
MIN_CSP = 70

MAX_HYST = 2
MIN_HYST = 0

MINIMUM_BAND = 8

MAX_TIMER_HOLD = 60 * 60
MIN_TIMER_HOLD = 60 * 5

MIN_ACTIVE_TIME = 60 * 5
MIN_INACTIVE_TIME = 60 * 5
FREE_COOLING_TIME = 60*5

# STATE VECTOR
#  temp_in, temp_csp, temp_hsp, on, hold-timer
STATE_VECTOR = [None, None, None, None, None]
def state_vector():
    return {
        'temp_in': None, # fahrenheit
        'temp_csp': None, # fahrenheit
        'temp_hsp': None, # fahrenheit
        'on': None, # binary
        'hold timer': None, # in seconds
        'is heating': False,
        'is cooling': False,
        'fan on': False,
        'hysteresis': 1.0, # degrees for hysteresis (fahrenheit)
        'heat on time': 0, # heating time spent on
        'cool on time': 0, # cooling time spent off
        'fan on time': 0,
        'heat off time': 0, # heating time spent on
        'cool off time': 0, # cooling time spent off
        'fan off time': 0,
    }

# ACTION VECTOR
# temp sensor, inc sp, dec sp, on button, hold-timer button, (physical interface)
# csp direct, hsp direct, timer direct (phone, cloud)
def action_vector(state=None):
    d = {
        "temp": None, #fahrenheit
        "inc sp": None, #binary
        "dec sp": None, #binary
        "on": None, #binary
        "hold timer": None, #binary
        "csp direct": None, #fahrenheit
        "hsp direct": None, #fahrenheit
        "timer direct": None, #in seconds
        "hysteresis": None, #in fahrenheit
    }
    if state:
        d["temp"] = state["temp_in"]
        d["on"] = state["on"]
    return d

# NOTE: stage 2 stuff, fan, etc
def output_vector():
    return {
        # LEDs
        'temp display': [],
        'cool display': [],
        'heat display': [],
        'blinking': None, # boolean
        'timer leds': None, # int
        # Mechanical
        'heat stage 1': None,
        'cool stage 1': None,
        'fan': None,
    }

# need the transition fxns: f(state vector, action vector) -> new state vector
# interval is in seconds
# NOTE: when we make the queue, need to think about if each action vector only
# contains ONE action, or if it contains a collection of actions. Both work for now
def transition(state, action, interval=15*60): # --> state

    # handle the power state
    # right now, the tstat being "off" means it won't call for heat/cool/fan
    state['on']  = action['on']

    # temp
    state['temp_in'] = action['temp']

    # hysteresis
    # clamp hysteresis to [MIN_HYST, MAX_HYST]
    if action['hysteresis']:
        state['hysteresis'] = max(min(action['hysteresis'], MAX_HYST), MIN_HYST)

    # handle increment/decrement setpoint thru buttons
    if action.get('inc sp') is not None:
        state['temp_hsp'] = min(state['temp_hsp']+int(action['inc sp']), MAX_HSP)
        state['temp_csp'] = min(state['temp_csp']+int(action['inc sp']), MAX_CSP)

    if action.get('dec sp') is not None:
        state['temp_hsp'] = max(state['temp_hsp']-int(action['dec sp']), MIN_HSP)
        state['temp_csp'] = max(state['temp_csp']-int(action['dec sp']), MIN_CSP)

    # handle directly setting hsp/csp
    if action.get('hsp direct') is not None:
        state['temp_hsp'] = max(min(action['hsp direct'], MAX_HSP), MIN_HSP)
    if action.get('csp direct') is not None:
        state['temp_csp'] = max(min(action['csp direct'], MAX_CSP), MIN_CSP)

    diff = state['temp_csp'] - state['temp_hsp']
    # e.g. if csp = 80 and hsp = 76, then diff is 4, so we set csp = 82, hsp = 74
    if diff < MINIMUM_BAND:
        state['temp_csp'] += diff / 2
        state['temp_hsp'] -= diff / 2

    # hold timer
    # NOTE: when we are visualizing the timer using the 4 LEDs (0%, 25, 50, 100%), make
    # sure to use the "floor" if we don't have an evenly divisible timer value.
    # All 4 LEDs will only be on if the hold timer value is at maximum (1hr)
    # we need to decrement the timer

    if state['hold timer'] > 0:
        # need to constrain timer to be a multiple of [interval]
        # so that this never becomes negative
        # TODO: fix this interval so that it matches how often the state machine runs
        state['hold timer'] -= interval
        # TODO: now turn the thermostat off if the timer has expired

    # if someone pushes the timer button
    if action.get('hold timer'):
        if state['hold timer'] == MAX_TIMER_HOLD: state['hold timer'] = 0
        else: state['hold timer'] = min(state['hold timer'] + interval, MAX_TIMER_HOLD)

    # timer direct
    state['hold timer'] = max(min(action['timer direct'], MAX_TIMER_HOLD), MIN_TIMER_HOLD)

    # check if the inactive times are safe for turning stuff on
    can_heat_on = state['heat on time'] or (not state['heat on time']) and (state['heat off time'] or state['heat off time'] > MIN_INACTIVE_TIME)
    can_heat_off = (not state['heat on time'])
    can_cool_on = state['cool on time'] or (not state['cool on time']) and (state['cool off time'] or state['cool off time'] > MIN_INACTIVE_TIME)
    can_cool_off = (not state['cool on time'])

    # handle heating w/ hysteresis

    print 'heat on?', can_heat_on, 'heat off?', can_heat_off, 'cool on?', can_cool_on, 'cool off?', can_cool_off
    if state['temp_in'] <= (state['temp_hsp'] - state['hysteresis']) and can_heat_on and can_cool_off:
        state['is heating'] = True
        state['is cooling'] = False
    elif state['is heating'] and (state['temp_in'] <= (state['temp_hsp'] + state['hysteresis'])) and can_heat_on and can_cool_off:
        state['is heating'] = True
        state['is cooling'] = False
    # handle cooling w/ hysteresis
    elif state['temp_in'] >= (state['temp_csp'] + state['hysteresis']) and can_heat_off and can_cool_on:
        state['is heating'] = False
        state['is cooling'] = True
        state['fan on'] = True
    elif state['is cooling'] and (state['temp_in'] >= (state['temp_csp'] - state['hysteresis'])) and can_heat_off and can_cool_on:
        state['is heating'] = False
        state['is cooling'] = True
        state['fan on'] = True
    elif state['heat on time'] and state['heat on time'] < MIN_ACTIVE_TIME:
        state['is heating'] = True

    elif state['heat off time'] and state['heat off time'] < MIN_INACTIVE_TIME:
        state['is heating'] = False

    elif state['cool on time'] and state['cool on time'] < MIN_ACTIVE_TIME:
        state['is cooling'] = True

    elif state['cool off time'] and state['cool off time'] < MIN_INACTIVE_TIME:
        state['is cooling'] = False
    else:
        state['is heating'] = False
        state['is cooling'] = False

    if not state['is cooling'] and state['cool on time'] > 0 and state['fan on time'] == 0: # cooling has just turned off
        state['fan on'] = True
        state['fan on time'] += 60
    elif not state['is cooling'] and state['fan on time'] > FREE_COOLING_TIME:
        state['fan on'] = False
        state['fan on time'] = 0
    elif state['fan on time'] > 0:
        state['fan on time'] += 60

    # now handle the timing
    # This will check how long we've already been heating/cooling. If we are switching heating/cooling
    # and this hasn't been on for more than MIN_ACTIVE_TIME, don't allow the transition
    if state['is heating']:
        state['heat on time'] += 60
        state['heat off time'] = 0
    else:
        state['heat on time'] = 0
        state['heat off time'] += 60
    if state['is cooling']:
        state['cool on time'] += 60
        state['cool off time'] = 0
    else:
        state['cool on time'] = 0
        state['cool off time'] += 60


    return state

# QUEUE: all actions go to the queue; from physical interface as well as schedules/intelligence
# - FIFO for now


# TODO: make a function to round to the integer values on the tstat iface
# (tstatsim.xbos.io)
def state_to_output(state): # --> output vector
    output = output_vector()

    # handle temp display
    output['temp display'].append(state['temp_in'])

    # handle if tstat is off
    if not state['on']:
        output['heat stage 1'] = False
        output['cool stage 1'] = False
        output['cool display'] = []
        output['heat display'] = []
        return output

    # tstat is on here

    # currently show whichever setpoint we are closer to
    heat_sp_diff = state['temp_in'] - state['temp_hsp']
    cool_sp_diff = state['temp_csp'] - state['temp_in']
    if heat_sp_diff < cool_sp_diff:
        show_sp = state['temp_hsp']
        show_type = 'heat display'
    else:
        show_sp = state['temp_csp']
        show_type = 'cool display'
    output[show_type].append(show_sp)

    # handle heating/cooling
    if state['is heating']:
        output['heat stage 1'] = True
        output['cool stage 1'] = False
        output['blinking'] = True
    elif state['is cooling']:
        output['heat stage 1'] = False
        output['cool stage 1'] = True
        output['blinking'] = True
    else:
        output['heat stage 1'] = False
        output['cool stage 1'] = False
        output['blinking'] = False

    if state['fan on']:
        output['fan'] = True
    else:
        output['fan'] = False

#    if output['heat stage 1']:
#        state['heat on time'] += interval
#    else:
#        state['heat off time'] += interval
#
#    if output['cool stage 1']:
#        state['cool on time'] += interval
#    else:
#        state['cool off time'] += interval
#
    # handle timer display
    if state['hold timer']:
        num_timer_leds = math.floor(state['hold timer'] / 15*60)
        output['timer leds'] = num_timer_leds

    return output

def read_action(state, temp_in):
    inp = raw_input(">")
    state['temp_in'] = temp_in
    action = action_vector(state)
    if len(inp) > 0:
        for x in inp.split(","):
            print x
            if '=' in x:
                k,v = x.split("=")
                action[k] = v
            else:
                action[x] = True
    return action

##Functions and Constants and Dataset for similarity-based scheduling

#Constants
TRAININGSET = 5760 # Number of 15-min intervals stored (5760 corresponds to 60 days)
DAYLENGTH = 96 #Number of 15-min intervals in a day

#Initialize Dataset (this should be changed to load from memory)
''' HISTORICAL SPs DATASET '''
from random import randint
data_HSP = np.empty([TRAININGSET])
data_HSP[:] = np.nan
data_CSP = np.empty([TRAININGSET])
data_CSP[:] = np.nan
for i in range (0, TRAININGSET):
    data_HSP[i] = randint(20, 30)
    data_CSP[i] = data_HSP[i] + 5

#Functions
def get_last_observed_vector(data, observation_length_intervals=DAYLENGTH):
    return (data[-observation_length_intervals:])

def cosine_similarity(a, b):
    """Calculate the cosine similarity between
    two non-zero vectors of equal length (https://en.wikipedia.org/wiki/Cosine_similarity)
    """
    return -1.*(1.0 - spatial.distance.cosine(a, b))

def hamming_distance(a, b):
    return np.count_nonzero(a != b)

def eucl_distance(a, b):
    return np.linalg.norm(a - b)

def find_k_similar_days(data, k=5, method=eucl_distance):
    last24SP = get_last_observed_vector(data)
    selector = np.arange(0,TRAININGSET,DAYLENGTH)
    similar_moments = np.empty([selector.shape[0],2])
    similar_moments[:,0]=selector
    similar_moments[:,1]=np.nan
    for i in range(0,selector.shape[0]):
        similar_moments[i,1] = eucl_distance(data[int(similar_moments[i,0]):int(similar_moments[i,0])+DAYLENGTH], last24SP)

    #print similar_moments
    similar_moments = similar_moments[similar_moments[:,1].argsort()]
    return similar_moments[1:k+1,:]

def predict(data, similar_moments, prediction_time_intervals = 32):
    prediction = np.zeros([prediction_time_intervals])
    for i in range(0,prediction_time_intervals):
        average=0
        for k in range (0, similar_moments.shape[0]):
            average += (1.0/float(similar_moments.shape[0])) * data[int(similar_moments[k,0]+i)]
        prediction[i]=average
    prediction[0]=data[-1]
    return prediction

''' Learn a thermal model with progressive decomposition '''
import random
import numpy as np


Heating_Samples= np.empty([1000,2])
Cooling_Samples= np.empty([1000,2])
DoNothing_Samples= np.empty([1000,2])

Heating_Samples[:,0]=random.randint(20, 30)
for i in range(0, 1000):
	Heating_Samples[i,1]=Heating_Samples[i,0]+random.random()

Cooling_Samples[:,0]=random.randint(20, 30)
for i in range(0, 1000):
	Cooling_Samples[i,1]=Cooling_Samples[i,0]-random.random()

DoNothing_Samples[:,0]=random.randint(20, 30)
for i in range(0, 1000):
	DoNothing_Samples[i,1]=DoNothing_Samples[i,0]-random.random()



Heating_rate = np.mean((Heating_Samples[:,1]-Heating_Samples[:,0])/Heating_Samples[:,0])
Cooling_rate = np.mean((Cooling_Samples[:,1]-Cooling_Samples[:,0])/Cooling_Samples[:,0])
DoNothing_rate = np.mean((DoNothing_Samples[:,1]-DoNothing_Samples[:,0])/DoNothing_Samples[:,0])


#print Heating_rate
#print Cooling_rate
#print DoNothing_rate

def predictThermal():
	return Heating_rate * a1 * Tin + Cooling_rate * a2 * Tin + DoNothing_rate * a3 * Tin

if __name__ == '__main__':
    # test similarity-based approach
    #print predict(data_HSP, find_k_similar_days(data_HSP, k=5, method=eucl_distance))
    #print predict(data_CSP, find_k_similar_days(data_HSP, k=5, method=eucl_distance))
    # initialize thermostat
    state = state_vector()
    temp_in = 70
    state['temp_in'] = temp_in
    state['temp_csp'] = 70
    state['temp_hsp'] = 65
    state['on'] = True
    state['hold timer'] = 0

    sim = Simulation(temp_in)

    times = []
    heating_state = []
    cooling_state = []
    fan_state = []
    hsp = []
    csp = []
    temp = []
    out_temp = []
    step = 0
    #plt.axis([0, 100, 0, 100])
    plt.ion()
    fig1 = plt.figure()
    ax1 = fig1.add_subplot(111, aspect='equal')
    mypatches = []
    while True:
        action = read_action(state, temp_in)
        print "ACTION>",action
        state = transition(state, action, interval=10*60)
        #print "STATE>",state
        output = state_to_output(state)
        #print "OUTPUT>",output
        temp_in = sim.forward(output['heat stage 1'], output['cool stage 1'])
        print 'heat off', state['heat off time'], 'heat on', state['heat on time'], MIN_INACTIVE_TIME, MIN_ACTIVE_TIME
        print "temperature>>", "[{0}]".format(state['temp_hsp']), temp_in, "[{0}]".format(state['temp_csp'])
        times.append(step)
        heating_state.append(output['heat stage 1'])
        cooling_state.append(output['cool stage 1'])
        fan_state.append(output['fan'])
        hsp.append(state['temp_hsp'])
        csp.append(state['temp_csp'])
        temp.append(temp_in)
        out_temp.append(sim.Tout)
        step += 1
        plt.plot(times, temp, color='k')
        plt.plot(times, out_temp, color='k',linestyle='--')
        plt.plot(times, hsp, color='r')
        plt.plot(times, csp, color='b')

        # plot heat/cool
        heatrectangles = []
        coolrectangles = []
        fanrectangles = []
        begin_hs = 0
        end_hs = 0
        for patch in mypatches:
            patch.set_visible(False)
        for idx, hs in enumerate(heating_state):
            ts = times[idx]
            if hs and not begin_hs:
                begin_hs = ts
            elif begin_hs and not hs and not end_hs:
                end_hs = ts
                heatrectangles.append((begin_hs, end_hs))
                begin_hs = end_hs = 0
        if begin_hs and not end_hs:
            heatrectangles.append((begin_hs, times[-1]))
        for rect in heatrectangles:
            patch = patches.Rectangle((rect[0],0), rect[1] - rect[0], 100, alpha=0.2, color='r')
            mypatches.append(patch)
            ax1.add_patch(patch)

        begin_cs = 0
        end_cs = 0
        for idx, cs in enumerate(cooling_state):
            ts = times[idx]
            if cs and not begin_cs:
                begin_cs = ts
            elif begin_cs and not cs and not end_cs:
                end_cs = ts
                coolrectangles.append((begin_cs, end_cs))
                begin_cs = end_cs = 0
        if begin_cs and not end_cs:
            coolrectangles.append((begin_cs, times[-1]))
        for rect in coolrectangles:
            patch = patches.Rectangle((rect[0],0), rect[1] - rect[0], 100, alpha=0.2, color='b')
            mypatches.append(patch)
            ax1.add_patch(patch)

        begin_fan = 0
        end_fan = 0
        for idx, fan in enumerate(fan_state):
            ts = times[idx]
            if fan and not begin_fan:
                begin_fan = ts
            elif begin_fan and not fan and not end_fan:
                end_fan = ts
                fanrectangles.append((begin_fan, end_fan))
                begin_fan = end_fan = 0
        if begin_fan and not end_fan:
            fanrectangles.append((begin_fan, times[-1]))
        for rect in fanrectangles:
            patch = patches.Rectangle((rect[0],10), rect[1] - rect[0], 30, alpha=0.4, color='k')
            mypatches.append(patch)
            ax1.add_patch(patch)
    while True:
        plt.pause(0.05)

