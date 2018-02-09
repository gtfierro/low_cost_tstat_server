(function(){
    'use strict';

    var appController = function ($scope, $http) {
        $scope.propertyBinding = {

        };
    };
    var finderfunction = function () {
        return {
            templatePath: '../../'
        };
    };
    angular
        .module('Elements.WebUI.Demos')
	    .controller("DemoController3", ["$scope", "$http",appController])
        .service("TemplateFinder", [finderfunction]);

})();