// Header directive   

(function () {
    "use strict";



    // header directive and get data from DataService
    var headerDirective = function ($http) {
        return {
            restrict: 'AE',
            scope: {
                "data": "="
            },
            link: function (scope, elem, attrs) {              
                scope.menuData = null;
                scope.totalItems = 0;
                scope.loader = false;
                $http.get("/Controls/demo/header/src/data.json").success(function (data) {
                    console.log("Before call");
                    scope.menuData = data; 
                    console.log(scope.menuData);
                    $(function () { $.getScript('/Controls/demo/header/src/shell-ui.js'); });
                    //for (var i = 0; i < scope.menuData.categories.length ; i++) {
                    //    for (var j = 0; j < scope.menuData.categories[i].subcategories.length ; j++) {
                    //        for (var k = 0; k < scope.menuData.categories[i].subcategories[j].services.length ; k++) {
                    //            scope.totalItems++;
                    //        }
                    //    }
                    //}
                    scope.loader = true;
                });
               
            },
            templateUrl: '/Controls/demo/header/src/header.tmpl.html'
        };
    }

    // register your directive into a dependent module.
    angular
        .module('header',[])
        .directive("headerel", ["$http", headerDirective]);
})();