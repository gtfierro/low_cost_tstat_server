(function () {


    var AppController = function ($http, $scope, $timeout,$interval) {
        var self = this;
        var temp_adjust = function (temp) {
            temp = Math.floor(temp);
            console.log("temp", temp);
            if (temp >= 69 && temp <= 72) {
               return temp;
            }
            else if (temp < 69 || temp > 72) {
                if (temp % 2 == 0) {
                    return temp;
                }
                else
                    return (temp + 1);
            }


        };
        var Update = function () {
            console.log("therm", $scope.data);
            $http({
                method: 'POST',
                url: '/sim',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: $scope.data
            }).then(
                function (response) {
                    console.log("response data", response.data);
                    var timestamp = new Date();
                    $scope.data = response.data;
                    $scope.temperature = {};
                    $scope.current = temp_adjust($scope.data.sensors[0].current);
                    $scope.outside = $scope.data.sensors[0].outside;
                    $scope.setpointh = temp_adjust($scope.data.sensors[0].setpointh);
                    $scope.setpointc = temp_adjust($scope.data.sensors[0].setpointc);
                    console.log("current", $scope.current);
                    console.log("setpoint", $scope.setpointh);
                    $scope.temperature.inside = $scope.current;
                    $scope.temperature.outside = $scope.outside;
                    var t0 = { meta: $scope.data.sensors[0].action, value: $scope.data.sensors[0].current };
                    var t1 = { meta: $scope.data.sensors[0].action, value: $scope.data.sensors[0].setpointh };
                    var t2 = { meta: $scope.data.sensors[0].action, value: $scope.data.sensors[0].setpointc };
                    pushLimit($scope.asyncData.series[0], t0, 12);
                    pushLimit($scope.asyncData.series[1], t1, 12);
                    pushLimit($scope.asyncData.series[2], t2, 12);
                    pushLimit($scope.asyncData.labels, [timestamp.getHours(),timestamp.getMinutes(),timestamp.getSeconds()].join(':'), 12);
                    var lights = $('.light');
                    lights.each(function () {
                        $(this).removeClass("heating cooling setpoint");
                    });
                    if ($scope.current !== $scope.setpointh) {
                        $('#' + $scope.current).addClass($scope.data.sensors[0].action);
                        $('#' + $scope.setpointh).addClass('setpoint');
                        $('#' + $scope.setpointc).addClass('setpoint');
                        console.log("not same");
                    }
                    else {
                        $('#' + $scope.setpointh).addClass('setpoint');
                        $('#' + $scope.setpointc).addClass('setpoint');
                        console.log("same");
                    }

                    for (var i = 0; i < $scope.data.status.length; i++) {
                        if ($scope.data.status[i].type === "eco") {
                            if ($scope.data.status[i].level === 100) {
                                $('#eco').removeClass('active inactive');
                                $('#eco').addClass('active');
                            }
                            else {
                                $('#eco').removeClass('active inactive');
                                $('#eco').addClass('inactive');
                            }
                        }
                    }

                }
                );
        };
        $scope.powerFlag = false;
        $scope.timerFlag = 0;
        $scope.down = function () {
            if ($scope.powerFlag === true) {
                console.log('down');
                $scope.setTimestamps("heating");
                Update();
            }
        };
        $scope.up = function () {
            if ($scope.powerFlag === true) {
                console.log('up');
                $scope.setTimestamps("cooling");
                Update();
            }
        };
        $scope.power = function () {
            $scope.powerFlag = !$scope.powerFlag;
            $interval(function () {
                Update();
                $scope.setTimestamps();
            }.bind(this), 10000);
            console.log('power');
            $scope.setTimestamps("power");
        };

        $scope.timer = function () {
            if ($scope.powerFlag === true) {
                $('#timer').removeClass('progress-' + timerFlag * 25);
                timerFlag = timerFlag + 1;
                console.log('timer');
                $('#timer').addClass('progress-' + timerFlag * 25);
                $scope.setTimestamps("timer");
                Update();
            }
        };


        $scope.setTimestamps = function (type) {
            var dt = new Date();
            var buttons = $scope.data.control_interface;
            var i;
            for (i = 0; i < buttons.length; i++) {
                if (buttons[i].type === type) {
                    $scope.data.control_interface[i].taps_since_last_post.push(dt.toUTCString());
                }
            }
        };
        var timestamp1 = new Date().toString();
        $scope.chartOptions = {
            plugins: [
                Chartist.plugins.tooltip()
            ]
        };
            $scope.asyncData = {
                labels: [timestamp1],
                series: [
                    [],
                    [],
                    []
                ]
        };
            function pushLimit(arr, elem, limit) {
                arr.push(elem);
                if (arr.length > limit) {
                    arr.splice(0, 1);
                }
            }



        $scope.events = {
            draw: function (obj) {
                // console.log(obj);
            }
        };


        var Get = function () {

            $http({
                url: '/sim',
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
            }).then(
                function (response) {
                    console.log("response data", response.data);
                    $scope.data = response.data;
                }
                );
        };
        Get();
        $interval(function () {
            $scope.setTimestamps();
        }.bind(this), 10000);
        console.log("abc");

    }

    angular.module('app', ['angular-chartist'])
        .controller('AppController', ['$http', '$scope','$timeout','$interval', AppController])


})();
