// Header directive   

(function () {
    "use strict";

    // pageSection directive and get data from DataService
    var pageSectionDirective = function ($http, $rootScope) {
        return {
            restrict: 'AE',
            scope: {               
                pageData: "=data"
            },
            link: function (scope, elem, attrs) {
                
            },
            templateUrl: '/Controls/demo/helpsection/src/pagesection2.tmpl.html'
        };
    }

    // register your directive into a dependent module.
    angular
        .module('pageSection2Module', [])
        .directive("pageSection2", ["$http", "$rootScope", pageSectionDirective]);
})();