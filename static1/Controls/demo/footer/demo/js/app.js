(function () {
    'use strict';

    var appController = function ($scope, $http) {
        $scope.footerBinding = {
            "properties": ["links.LinkTitle", "links.action", "srcPath"],
            "links": [{ "LinkTitle": { "value": "Microsoft Data Protection Notice", "type": "textbox" }, "action": { "value": "#", "type": "textbox" } }, { "LinkTitle": { "value": "Contact Us", "type": "textbox" }, "action": { "value": "#", "type": "textbox" } }],
            "srcPath": { "value": "/Controls/assets/images/microsoft_logo_footer.png", "type": "fileupload" }
        };        
    };
    var finderfunction = function () {
        return {
            templatePath: '../../'
        };
    };
    angular
        .module('app')
	    .controller("FooterController1", ["$scope", "$http", appController])
        .service("TemplateFinder", [finderfunction]);

})();