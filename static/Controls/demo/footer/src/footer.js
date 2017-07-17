
(function () {
    "use strict";
   
    var footerDirective = function (TemplateFinder) {
        return {
            restrict: "EA",
            scope: {
                linksObject: "=",
                srcPath:"="
            },           
            link: function ($scope, $element, $attrs, $ctrls) {
               
            },
            templateUrl: TemplateFinder.templatePath + "/Controls/demo/footer/src/footer.tmpl.html"

        }
    };

   angular.module('footerel', [])
    .directive("footerel", ["TemplateFinder", footerDirective]);
})();