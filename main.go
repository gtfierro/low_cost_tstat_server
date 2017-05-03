package main

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/julienschmidt/httprouter"
)

var CURRENT = &ctliface{
	Taps:     []tap{},
	Sensors:  []sensor{},
	Statuses: []status{},
}

func respondError(err error, w http.ResponseWriter) {
	enc := json.NewEncoder(w)
	w.WriteHeader(500)
	if write_err := enc.Encode(map[string]interface{}{"Error": err.Error()}); write_err != nil {
		log.Println(write_err)
	}
}

type tap struct {
	Taps_since_last_post []string `json:"taps_since_last_post"`
	Taptype              string   `json:"type"`
}

type sensor struct {
	Action     string  `json:"action"`
	Current    float64 `json:"current"`
	Setpoint   float64 `json:"setpoint"`
	Sensortype string  `json:"type"`
}

type status struct {
	Color      string `json:"color"`
	Level      int    `json:"level"`
	Statustype string `json:"type"`
}

type ctliface struct {
	Taps     []tap    `json:"control_interface"`
	Sensors  []sensor `json:"sensors"`
	Statuses []status `json:"status"`
}

// merges this into CURRENT
func merge(new ctliface) {
	// merge taps
	log.Println(new)
	for _, tap := range new.Taps {
		foundtap := false
		for idx, oldtap := range CURRENT.Taps {
			if tap.Taptype == oldtap.Taptype {
				CURRENT.Taps[idx] = tap
				foundtap = true
				break
			}
		}
		if !foundtap {
			CURRENT.Taps = append(CURRENT.Taps, tap)
		}
	}
	for _, sensor := range new.Sensors {
		foundsensor := false
		for idx, oldsensor := range CURRENT.Sensors {
			if sensor.Sensortype == oldsensor.Sensortype {
				CURRENT.Sensors[idx] = sensor
				foundsensor = true
				break
			}
		}
		if !foundsensor {
			CURRENT.Sensors = append(CURRENT.Sensors, sensor)
		}
	}
	for _, status := range new.Statuses {
		foundstatus := false
		for idx, oldstatus := range CURRENT.Statuses {
			if status.Statustype == oldstatus.Statustype {
				CURRENT.Statuses[idx] = status
				foundstatus = true
				break
			}
		}
		if !foundstatus {
			CURRENT.Statuses = append(CURRENT.Statuses, status)
		}
	}
}

func handleUpdate(w http.ResponseWriter, req *http.Request, p httprouter.Params) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	defer req.Body.Close()
	dec := json.NewDecoder(req.Body)
	var input ctliface
	if err := dec.Decode(&input); err != nil {
		respondError(err, w)
		return
	}
	merge(input)
	enc := json.NewEncoder(w)
	if err := enc.Encode(CURRENT); err != nil {
		respondError(err, w)
		return
	}
	log.Printf("NOW: %+v", CURRENT)
	//w.WriteHeader(200)
}

func handleStatus(w http.ResponseWriter, req *http.Request, p httprouter.Params) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	defer req.Body.Close()
	enc := json.NewEncoder(w)
	if err := enc.Encode(CURRENT); err != nil {
		respondError(err, w)
		return
	}
	log.Printf("NOW: %+v", CURRENT)
}

var help = `
POST /update: merges in state
GET /status: retrieves current state
GET /: this page

JSON format:
{
    "control_interface": [
        {
            "taps_since_last_post": [
                "timestamp",
                "timestamp",
                "timestamp"
            ],
            "type": "heating"
        },
        {
            "taps_since_last_post": [
                "timestamp",
                "timestamp",
                "timestamp"
            ],
            "type": "cooling"
        },
        {
            "taps_since_last_post": [
                "timestamp",
                "timestamp",
                "timestamp"
            ],
            "type": "power"
        },
        {
            "taps_since_last_post": [
                "timestamp",
                "timestamp",
                "timestamp"
            ],
            "type": "timer"
        }
    ],
    "sensors": [
        {
            "action": "heating",
            "current": 73,
            "setpoint": 75,
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
`

func handleHome(w http.ResponseWriter, req *http.Request, p httprouter.Params) {
	w.Header().Set("Content-Type", "text/plain")
	defer req.Body.Close()
	w.Write([]byte(help))
}

func main() {
	router := httprouter.New()
	router.POST("/update", handleUpdate)
	router.GET("/status", handleStatus)
	router.GET("/", handleHome)

	log.Fatal(http.ListenAndServe(":8000", router))
}
