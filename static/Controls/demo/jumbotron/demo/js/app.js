(function(){
    'use strict';

    var appController = function($scope,$rootScope, $http) {
        $scope.$on('gridster-item-resized', function (item) {
            console.log(item);
            console.log($rootScope.itam);
            // item.gridster
            // item.row
            // item.col
            // item.sizeX
            // item.sizeY
            // item.minSizeX
            // item.minSizeY
            // item.maxSizeX
            // item.maxSizeY
        })
    };
    var finderfunction = function () {
        return {
            templatePath: '../../'
        };
    };
    angular
        .module('Elements.WebUI.Demos')
	    .controller("DemoController1", ["$scope","$rootScope", "$http",appController])
        .service("TemplateFinder", [finderfunction]);

})();