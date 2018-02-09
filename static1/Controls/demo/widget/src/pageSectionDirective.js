// Header directive   

(function () {
    "use strict";

    // pageSection directive and get data from DataService
    var pageSectionDirective = function ($http, $rootScope) {
        return {
            restrict: 'AE',
            replace: true,
            scope: {               
                pageData: "=data"
            },
            link: function (scope, elem, attrs) {
                
            },
            templateUrl: '/Controls/demo/widget/src/pagesection.tmpl.html'
        };
    }

    // register your directive into a dependent module.
    angular
        .module('pageSectionModule', [])
        .directive("pageSection", ["$http", "$rootScope", pageSectionDirective]);
})();