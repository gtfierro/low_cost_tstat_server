// Header directive   

(function () {
    "use strict";

    // jumbotron directive and get data from DataService
    var jumbotronDirective = function ($http, $rootScope) {
        return {
            restrict: 'AE',
            scope: {
                data: "="
            },
            replace: true,
            link: function ($scope, element, attrs) {                
                element.css({
                    'background-image': 'url(' + $scope.data.bgUrl.value + ')',
                    'background-repeat': 'no-repeat',
                });

                $scope.$watch('data.bgUrl', function () {
                    element.css({
                        'background-image': 'url(' + $scope.data.bgUrl.value + ')',
                        'background-repeat': 'no-repeat',
                    });
                });
            },
            templateUrl: '/Controls/demo/jumbotron/src/jumbotron.tmpl.html'
        };
    }

    // register your directive into a dependent module.
    angular
        .module('jumbotronModule',[])
        .directive("jumbotron", ["$http", "$rootScope", jumbotronDirective]);
})();