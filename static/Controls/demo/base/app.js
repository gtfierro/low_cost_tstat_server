(function () {
    

    var AppController = function ($http, $scope, $timeout,$interval) {
        var self = this;
        var temp_adjust = function (temp) {
            temp = Math.floor(temp);
            console.log("temp", temp);
            if (temp > 61 && temp < 85) {
                if (temp % 2 ==+ 0) {
                    console.log("temp+1", (temp + 1));
                    return (temp + 1);
                }
                else
                    return temp;
            }
            else if (temp < 61) {
                if (temp > 59)
                    return (61);
                else if (temp < 58 && temp > 56)
                    return (58);
                else
                    return (54);
            }
            else if (temp > 85) {
                if (temp < 87)
                    return (85);
                else if (temp > 85 && temp < 91)
                    return (88);
                else
                    return (92);
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
                    $scope.setpoint = temp_adjust($scope.data.sensors[0].setpoint);
                    console.log("current", $scope.current);
                    console.log("setpoint", $scope.setpoint);
                    $scope.temperature.inside = $scope.current;
                    $scope.temperature.outside = $scope.outside;
                    if ($scope.asyncData.labels.length > 10)
                    {
                        $scope.asyncdata.labels.shift();
                        $scope.asyncData.series[0].shift();
                        $scope.asyncData.series[1].shift();
                    }
                    $scope.asyncData.labels.push(timestamp.toString());
                    $scope.asyncData.series[0].push($scope.current);
                    $scope.asyncData.series[1].push($scope.setpoint);
                    var lights = $('.light');
                    lights.each(function () {
                        $(this).removeClass("heating cooling setpoint");
                    });
                    if ($scope.current !== $scope.setpoint) {
                        $('#' + $scope.current).addClass($scope.data.sensors[0].action);
                        $('#' + $scope.setpoint).addClass('setpoint');
                        console.log("not same");
                    }
                    else {
                        $('#' + $scope.setpoint).addClass('setpoint');
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
            }.bind(this), 1000);
            console.log('power');
            $scope.setTimestamps("power");
            Update();
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
            $scope.asyncData = {
                labels: [timestamp1],
                series: [
                    [73],
                    [76],
                ]
            };


        $scope.events = {
            draw: function (obj) {
                // console.log(obj);
            }
        };
        $scope.pieData = {
            series: [20, 10, 30, 40]
        };

        var Get = function () {

            $http({
                url: '/Scripts/status.json',
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
            }).then(
                function (response) {
                    console.log("response data", response.data);
                    $scope.data = response.data;
                    var timestamp = new Date();
                    $scope.temperature = {};
                    $scope.current = temp_adjust($scope.data.sensors[0].current);
                    $scope.outside = $scope.data.sensors[0].outside;
                    $scope.setpoint = temp_adjust($scope.data.sensors[0].setpoint);
                    console.log("current", $scope.current);
                    console.log("setpoint", $scope.setpoint);
                    $scope.temperature.inside = $scope.current;
                    $scope.temperature.outside = $scope.outside;
                    $scope.asyncData.labels.push(timestamp.toString());
                    $scope.asyncData.series[0].push($scope.current);
                    $scope.asyncData.series[1].push($scope.setpoint);
                    var lights = $('.light');
                    lights.each(function () {
                        $(this).removeClass("heating cooling setpoint");
                    });
                    if ($scope.current !== $scope.setpoint) {
                        $('#' + $scope.current).addClass($scope.data.sensors[0].action);
                        $('#' + $scope.setpoint).addClass('setpoint');
                    }
                    else {
                        $('#' + $scope.setpoint).addClass('setpoint');
                    }

                    for (var i = 0; i < $scope.data.status.length; i++) {
                        if ($scope.data.status[i].type === "eco") {
                            if ($scope.data.status[i].level === 100) {
                                $('#eco').removeClass(['active', 'inactive']);
                                $('#eco').addClass('active');
                            }
                            else {
                                $('#eco').removeClass(['active', 'inactive']);
                                $('#eco').addClass('inactive');
                            }
                        }
                    }
                }
                );
        };
        Get();
        console.log("abc");

    }

    angular.module('app', ['angular-chartist'])
        .controller('AppController', ['$http', '$scope','$timeout','$interval', AppController])


})();
