#!/usr/bin/env python
import math
from simulation import Simulation

# TODO: add more safety constraints such as timers for heating/cooling

# CONSTRAINTS
MAX_HSP = 70
MIN_HSP = 50

MAX_CSP = 90
MIN_CSP = 70

MAX_HYST = 2
MIN_HYST = 0

MAX_TIMER_HOLD = 60 * 60

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

    # hold timer
    # NOTE: when we are visualizing the timer using the 4 LEDs (0%, 25, 50, 100%), make
    # sure to use the "floor" if we don't have an evenly divisible timer value.
    # All 4 LEDs will only be on if the hold timer value is at maximum (1hr)
    # we need to decrement the timer

    if state['hold timer'] > 0:
        # need to constrain timer to be a multiple of [interval]
        # so that this never becomes negative
        state['hold timer'] -= interval
        # TODO: now turn the thermostat off if the timer has expired

    if action.get('hold timer'):
        if state['hold timer'] == MAX_TIMER_HOLD: state['hold timer'] = 0
        else: state['hold timer'] = min(state['hold timer'] + interval, MAX_TIMER_HOLD)

    # timer direct
    state['hold timer'] = min(action['timer direct'], MAX_TIMER_HOLD)

    # handle heating w/ hysteresis
    if state['temp_in'] <= (state['temp_hsp'] - state['hysteresis']):
        state['is heating'] = True
        state['is cooling'] = False
    elif state['is heating'] and (state['temp_in'] <= (state['temp_hsp'] + state['hysteresis'])):
        state['is heating'] = True
        state['is cooling'] = False

    # handle cooling w/ hysteresis
    elif state['temp_in'] >= (state['temp_csp'] + state['hysteresis']):
        state['is heating'] = False
        state['is cooling'] = True
    elif state['is cooling'] and (state['temp_in'] >= (state['temp_csp'] - state['hysteresis'])):
        state['is heating'] = False
        state['is cooling'] = True
    else:
        state['is heating'] = False
        state['is cooling'] = False

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

    while True:
        action = read_action(state, temp_in)
        print "ACTION>",action
        state = transition(state, action, interval=10*60)
        #print "STATE>",state
        output = state_to_output(state)
        #print "OUTPUT>",output
        temp_in = sim.forward(output['heat stage 1'], output['cool stage 1'])
        print "temperature>>", "[{0}]".format(state['temp_hsp']), temp_in, "[{0}]".format(state['temp_csp'])
