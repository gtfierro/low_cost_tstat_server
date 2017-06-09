(function () {
    'use strict';

    var AppController = function ($http, $scope, $timeout) {
        var self = this;
        var Update = function (therm_data) {
            console.log("therm",therm_data);
            $http({
                method: 'POST',
                url:'/sim',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: therm_data
            }).then(
                function (response) {
                    $scope.data = response.data;
                }
            );
        }
        $scope.setTimestamps = function (type) {
            var dt = new Date();
            buttons = $scope.data.control_interface;
            for (i = 0; i < length(buttons); i++) {
                if (buttons[i].type == type) {
                    buttons.taps_since_last_post.push(dt.toUTCString());
                }
            }
        }
        $timeout(function () {
            console.log('load data');

            $scope.asyncData = {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                series: [
                    [1000, 1200, 1300, 1200, 1440, 1800],
                    [1600, 1550, 1497, 1440, 1200, 1000],
                ]
            };

        }.bind(this), 5000);
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
                url: '/sim',
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
            }).then(
                function (response) {
                    $scope.data = response.data;
                    $scope.temperature = {};
                    $scope.temperature.inside = $scope.data.sensors[0].current;
                    $scope.temperature.outside = $scope.data.sensors[0].current;
                    var lights = $('.light');
                    lights.each(function () {
                        $(this).removeClass(['heating', 'cooling', 'setpoint']);
                    });
                    if ($scope.data.sensors[0].current != $scope.data.sensors[0].setpoint) {
                        $('#' + $scope.data.sensors[0].current).addClass($scope.data.sensors[0].action)
                        $('#' + $scope.data.sensors[0].setpoint).addClass('setpoint');
                    }
                    else {
                        $('#' + $scope.data.sensors[0].setpoint).addClass('setpoint');
                    }

                    for (var i = 0; i < $scope.data.status.length; i++) {
                        if ($scope.data.status[i].type == "eco") {
                            if ($scope.data.status[i].level == 100) {
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
        }
        Get();
        setInterval(Update($scope.data), 10000);
    }
    
    angular.module('app', ['angular-chartist'])
        .controller('AppController', ['$http', '$scope','$timeout', AppController])


})();
