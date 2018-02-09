(function(){
    'use strict';

    var appController = function ($scope, $http, $rootScope) {
       
    };
    var finderfunction = function () {
        return {
            templatePath: '../../'
        };
    };
    angular
        .module('Elements.WebUI.Demos')
	    .controller("HeaderController", ["$scope", "$http", "$rootScope", appController])
        .service("TemplateFinder", [finderfunction]);

})();