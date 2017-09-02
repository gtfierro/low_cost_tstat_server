#!/usr/bin/env python
import math
from simulation import Simulation
import matplotlib
matplotlib.use('TkAgg')
import matplotlib.pyplot as plt
import numpy as np

# TODO: add more safety constraints such as timers for heating/cooling

# TODO: add fans:
# - turn on fan when cooling
# - fan runs for 5 min after cooling turns off
# - fan is on for minimum 5 min

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

MIN_ACTIVE_TIME = 60 * 3
MIN_INACTIVE_TIME = 60 * 5

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
        'hysteresis': 1.0, # degrees for hysteresis (fahrenheit)
        'heat on time': 0, # heating time spent on
        'cool on time': 0, # cooling time spent off
        'heat off time': 0, # heating time spent on
        'cool off time': 0, # cooling time spent off
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

    # TODO: integrate this into the state transition

    # handle heating w/ hysteresis
    can_heat_on = (not state['heat on time']) and (state['heat off time'] or state['heat off time'] > MIN_INACTIVE_TIME)
    can_heat_off = (not state['heat on time'])

    if state['temp_in'] <= (state['temp_hsp'] - state['hysteresis']) and can_heat_on:
        state['is heating'] = True
        state['is cooling'] = False
    elif state['is heating'] and (state['temp_in'] <= (state['temp_hsp'] + state['hysteresis'])) and can_heat_on:
        state['is heating'] = True
        state['is cooling'] = False
    # handle cooling w/ hysteresis
    elif state['temp_in'] >= (state['temp_csp'] + state['hysteresis']) and can_heat_off:
        state['is heating'] = False
        state['is cooling'] = True
    elif state['is cooling'] and (state['temp_in'] >= (state['temp_csp'] - state['hysteresis']) and can_heat_off):
        state['is heating'] = False
        state['is cooling'] = True
    elif state['heat on time'] and state['heat on time'] < MIN_ACTIVE_TIME:
        state['is heating'] = True
    elif state['heat off time'] and state['heat off time'] < MIN_INACTIVE_TIME:
        state['is heating'] = False
    else:
        state['is heating'] = False
        state['is cooling'] = False


    # now handle the timing
    # This will check how long we've already been heating/cooling. If we are switching heating/cooling
    # and this hasn't been on for more than MIN_ACTIVE_TIME, don't allow the transition
    if state['is heating']:
        state['heat on time'] += 60
        state['heat off time'] = 0
    else:
        state['heat on time'] = 0
        state['heat off time'] += 60

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

if __name__ == '__main__':
    # initialize thermostat
    state = state_vector()
    temp_in = 70
    state['temp_in'] = temp_in
    state['temp_csp'] = 75
    state['temp_hsp'] = 68
    state['on'] = True
    state['hold timer'] = 0

    sim = Simulation(temp_in)

    times = []
    heating_state = []
    cooling_state = []
    hsp = []
    csp = []
    temp = []
    out_temp = []
    step = 0
    #plt.axis([0, 100, 0, 100])
    plt.ion()
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
        hsp.append(state['temp_hsp'])
        csp.append(state['temp_csp'])
        temp.append(temp_in)
        out_temp.append(sim.Tout)
        step += 1
        plt.plot(times, temp, color='k')
        plt.plot(times, out_temp, color='k',linestyle='--')
        plt.plot(times, hsp, color='r')
        plt.plot(times, csp, color='b')

    while True:
        plt.pause(0.05)

