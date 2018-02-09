(function () {
    "use strict";

    /*  VX GRID 
        LAST UPDATE - 29-10-2015 16:38 
        LAST UPDATE BY - ASPARIDA
        
        VX GRID CONFIG (BOUND TO 'config=') IN DIRECTIVE CALL
        -----------------------------------------------------------       
        <CONFIG>.enableDropdownsInHeader        <SUPPORTED : Y>    :   <BOOLEAN>   SET TO TRUE TO ENABLE DROPDOWNS ON C0LUMNS, ELSE DEFAULT SORT ON HEADER CLICK
        <CONFIG>.selectionEnabled               <SUPPORTED : Y>    :   <BOOLEAN>   SET TO TRUE FOR ENABLE ROW SELECTION
        <CONFIG>.multiSelectionEnabled          <SUPPORTED : Y>    :   <BOOLEAN>   SET TO TRUE FOR ENABLE MULTI ROW SELECTION - DEPENDENT ON 
        <CONFIG>.showGridStats                  <SUPPORTED : Y>    :   <BOOLEAN>   SET TO TRUE FOR ENABLE ROW SELECTION
        <CONFIG>.showGridOptions                <SUPPORTED : Y>    :   <BOOLEAN>   SET TO TRUE FOR ENABLE ROW SELECTION
        <CONFIG>.selectAllOnRenderAll           <SUPPORTED : Y>    :   <BOOLEAN>   SET TO TRUE FOR ENABLE SELECT ONLY WHEN ALL ROWS ARE RENDERED
        <CONFIG>.multiSelectionDependentCol     <SUPPORTED : Y>    :   <STRING>    SET TO COLUMN ON WHICH MULTI SELECTION IS DEPENDENT OR SET TO '' OR NULL
        <CONFIG>.onSelectionReturnCol           <SUPPORTED : Y>    :   <STRING>    SET TO COLUMN WHICH POPERTY IS RETURNED ON ROW SELECTION CHANGE
        <CONFIG>.showTable                      <SUPPORTED : Y>    :   <BOOLEAN>   SET TO TRUE FOR ENABLE SELECT ONLY WHEN ALL ROWS ARE RENDERED
        <CONFIG>.data                           <SUPPORTED : Y>    :   <ARRAY>
        <CONFIG>.xsRowTitleTemplate             <SUPPORTED : Y>    :   <STRING>    SET TO XS ONLY TEMPLATE - DEFAULTS TO PRIMARY COLUMN HEADER
        
        VX GRID COLUMN CONFIG (BOUND TO EACH ITEM IN  'vxConfig.columnDefConfigs') IN DIRECTIVE DEFINTION
        -----------------------------------------------------------------------------------------------------
        <COLUMN>.dropDownEnabled                <SUPPORTED : Y>    :   <BOOLEAN>   SET TO TRUE TO ENABLE COLUMN DROPDOWN
        <COLUMN>.ddSort                         <SUPPORTED : Y>    :   <BOOLEAN>   SET TO TRUE TO ADD SORT OPTION TO COLUMN DROPDOWN
        <COLUMN>.ddFilters                      <SUPPORTED : Y>    :   <BOOLEAN>   SET TO TRUE TO ADD FILTERS TO COLUMN DROPDOWN
        <COLUMN>.ddGroup                        <SUPPORTED : N>    :   <BOOLEAN>   SET TO TRUE TO ADD GROUP OPTION TO COLUMN DROPDOWN
        <COLUMN>.hidden                         <SUPPORTED : Y>    :   <BOOLEAN>   SET TO TRUE TO HIDE COLUMN ON DEFAULT
        <COLUMN>.xsHidden                       <SUPPORTED : Y>    :   <BOOLEAN>   SET TO TRUE TO HIDE COLUMN ON DEFAULT ON XS RESOLUTION
        <COLUMN>.locked                         <SUPPORTED : Y>    :   <BOOLEAN>   SET TO TRUE TO FIX COLUMN VISIBILITY, COLUMN ORDER, COLUMN WIDTH
        <COLUMN>.primary                        <SUPPORTED : Y>    :   <BOOLEAN>   SET TO TRUE TO ENABLE THIS COLUMN AS PRIMARY
        <COLUMN>.width                          <SUPPORTED : Y>    :   <STRING>    SET WIDTH FOR COLUMN - DEFUALT '200'
        <COLUMN>.renderDefn                     <SUPPORTED : Y>    :   <BOOLEAN>   SET TO TRUE ENABLE CUSTOM TEMEPLATE
        <COLUMN>.headerDefn                     <SUPPORTED : N>    :   <STRING>    SET CUSTOM HEADER TEMPLATE
        <COLUMN>.cellDefn                       <SUPPORTED : Y>    :   <STRING>    SET CUSTOM CELL TEMPLATE - USE 'VX_ROW_POINT' FOR ROW LEVEL PROPERTY & 'VX_DATA_POINT' FOR ROW CELL LEVEL PROPERTY

        VX GRID EVENTS
        ----------------------
        'vxGridRowSelectionChange'                  <OUT>   EVENT ON ROW SELECTION CHANGE EMITING DATA :   {'key': <ROW_VALUE_'onSelectionReturnCol'>, 'value': <BOOLEAN_NEW_SELECTION_STATE>, '_pKey': <PRIMARY_ID_VXGRID> }
        'vxGridRowMultiSelectionChange'             <OUT>   EVENT ON MULTIROW SELECTION CHANGE EMITING DATA COLLECTION OF :   {'key': <ROW_VALUE_'onSelectionReturnCol'>, 'value': <BOOLEAN_NEW_SELECTION_STATE>, '_pKey': <PRIMARY_ID_VXGRID> }
        'vxPartiallyRendered'                       <OUT>   EVENT ON VX GRID PARTIAL RENDERED
        'vxCompletelyRendered'                      <OUT>   EVENT ON VX GRID COMPLETE RENDERED
        'vxPartiallyRenderedSelectAllDisabled'      <OUT>   EVENT ON VX GRID PARTIAL RENDERED AND SELECT ALL DISABLED - ONLY ON  <CONFIG>.selectAllOnRenderAll SET TO TRUE
        'vxCompletelyRenderedSelectAllEnabled'      <OUT>   EVENT ON VX GRID COMPLETE RENDERED AND SELECT ALL ENABLED - ONLY ON  <CONFIG>.selectAllOnRenderAll SET TO TRUE
        'vxGridSettingsChanged'                     <OUT>   EVENT ON VX GRID SETTINGS CHANGED
        'vxGridSettingsBuilt'                       <OUT>   EVENT ON VX GRID COL SETTINGS BUILT
        'vxGridChangeRowClass'                      <IN>    ON EVENT, ROW CLASS CHANGED AS PER PARAMETER - ACCPETS { ID : VXGRID_ID, DATA : []} , DATA IS COLLECTION OF {'key': 'ROW PRIMARY ID VALUE', 'value', '<NEW ROW CLASS NAMES>'}
        'vxGridResetRowClass'                       <IN>    ON EVENT, RESETS ALL CLASS NAMES ADDED AS PART OF 'vxGridChangeRowClass'
        'vxGridDisableRowSelection'                 <IN>    ON EVENT, ENABLES/DISABLES ROW SELECTION - ACCEPTS { ID : VXGRID_ID, DATA : []} , DATA IS COLLECTION OF {'key': 'ROW PRIMARY ID VALUE', 'value': <BOOLEAN>}
        'vxGridResetDisableRowSelection'            <IN>    ON EVENT, ENABLES ALL ROW FOR SELECTION
        'vxGridOpenManageColumns',                  <IN>    ON EVENT, OPENS MANAGE COLUMNS MODAL
        'vxGridResetVxInstance',                    <IN>    ON EVENT, RESETS THE TABLE INSTANCE 
        'vxGridClearFilters',                       <IN>    ON EVENT, CLEARS ALL FILTERS APPLIED
        'vxGridSelectAllFiltered',                  <IN>    ON EVENT, SELECTS ALL ROWS WITH FILTES APPLIED 
        'vxGridClearSelection',                     <IN>    ON EVENT, CLEARS SELECTION OF ALL ROWS
        'vxGridRevealWrapToggle'                    <IN>    ON EVENT, TOGGLES WRAP ON COLUMNS

        VX GRID CONFIG EXTENSIONS
        ----------------------------
        <CONFIG>.getVxCounts()                  <NO PARAMS>         RETURNS COUNT - {'vxAllDataLength': <LENGTH OF ALL DATA> , 'vxFilteredDataLength' : <LENGTH OF FILTERED DATA SET>, 'vxSelectedDataLength' : <LENGTH OF SELECTED DATA SET>

    */

    /* CAPITALIZE FIRST LETTER - STRING PROTOTYPE*/
    String.prototype.capitalizeFirstLetter = function () {
        return this.charAt(0).toUpperCase() + this.slice(1);
    }

    String.prototype.replaceAll = function (find, replaceWith) {
        var regex = new RegExp(find, 'g');
        return this.replace(regex, replaceWith);
    }

    angular.module('vx.grid.modules', ['ngSanitize', 'ui.bootstrap', 'vs-repeat'])
    .directive("vxGrid", function () {
        return {
            restrict: 'AEC',
            scope: {
                config: '=',
                scrollParent: '='
            },
            controller: ["$scope", "$modal", "$sce", "$timeout", "$rootScope", "$window", "$filter", function ($scope, $modal, $sce, $timeout, $rootScope, $window, $filter) {
                $scope.vxColSettings = {};
                var w = angular.element($window);
                $scope.getWindowDimensions = function () {
                    return {
                        'h': w.height(),
                        'w': w.width()
                    };
                };
                $rootScope.enableClickOutside = true;
                $scope.resetVxInstance = function () {
                    $scope.vxColSettings = {
                        'primaryId': null,
                        'dropdDownEnabled': {},
                        'dropdDownLoaded': {},
                        'dropdDownOpen': {},
                        'dropDownSort': {},
                        'dropDownFilters': {},
                        'dropDownGroup': {},
                        'colFiltersStatus': {},
                        'colFilterPairs': {},
                        'colFiltersActivated': {},
                        'lastProcessedForFilters': {},
                        'multiSelected': [],
                        'multiSelColDependent': false,
                        'predicate': '',
                        'reverse': false,
                        'reverseSettings': {},
                        'groupPredicate': {},
                        'groupByColActivated': {},
                        'rowSelected': {},
                        'vxRowClass': {},
                        'vxRowSelectionDisable': {},
                        'revealWrapRowData': false,
                        'selectAllEnabled': true,
                        'menu': false,
                        'xsViewEnabled': false,
                        'xsRowTitleTemplateAvailable': false,
                        'xsSearch': '',
                        'latchExcess': 10
                    };
                    if ($scope.getWindowDimensions().w < 768) {
                        $scope.vxColSettings.xsViewEnabled = true;
                        $scope.vxColSettings.latchExcess = 5;
                    }
                    $scope.vxConfig = angular.copy($scope.config);
                    /* GETTING / SETTING PRIMARY COLUMN*/
                    var _primaryColDefn = _.find($scope.vxConfig.columnDefConfigs, function (col) { return col.primary == true });
                    var primaryId = '_uid';
                    if (typeof _primaryColDefn !== 'undefined' && _primaryColDefn != null) {
                        /* PRIMARY COLUMN EXISTS */
                        _.each($scope.vxConfig.data, function (row, index) { row[primaryId] = row[_primaryColDefn.id] });
                        primaryId = _primaryColDefn.id;
                    }
                    else {
                        /* PRIMARY COLUMN DOES NOT EXISTS */
                        _.each($scope.vxConfig.data, function (row, index) { row.primaryId = index });
                    }
                    $scope.vxColSettings.primaryId = primaryId;
                    /* ENBALE ROW SELECTION */
                    if ($scope.vxConfig.selectionEnabled == true) {
                        /* ADDING CHECKBOX COLUMN DEFINITION */
                        var col = _.find($scope.vxConfig.columnDefConfigs, function (col) { return col.id.localeCompare('checkbox') == 0 });
                        if (typeof col === 'undefined' || col == null || col == {}) {
                            var _selColDefn = { id: 'checkbox', columnName: 'Row Selection', renderDefn: true, ddSort: false, ddGroup: false, ddFilters: false, width: '50', locked: true, cellDefn: '<div class="vx-row-select"><input class="vx-row-select-toggle" type="checkbox" ng-model="vxColSettings.rowSelected[VX_ROW_POINT]" ng-change="rowSelectionChanged(row)" ng-disabled="vxColSettings.vxRowSelectionDisable[VX_ROW_POINT]" /></div>' };
                            $scope.vxConfig.columnDefConfigs.unshift(_selColDefn);
                        }
                        /* SEETING ALL ROW SELECTIONS TO FALSE */
                        _.each($scope.vxConfig.data, function (row, index) {
                            var rowId = row[$scope.vxColSettings.primaryId];
                            $scope.vxColSettings.rowSelected[rowId] = false;
                            $scope.vxColSettings.vxRowSelectionDisable[rowId] = false;
                        });
                    }
                    $scope.multiBoxFilters = [];
                    var _propDefns = [
                        { prop: 'enableDropdownsInHeader', defValue: false },
                        { prop: 'selectionEnabled', defValue: false },
                        { prop: 'multiSelectionEnabled', defValue: false },
                        { prop: 'showGridStats', defValue: false },
                        { prop: 'showGridOptions', defValue: false },
                        { prop: 'selectAllOnRenderAll', defValue: false },
                        { prop: 'data', defValue: [] },
                        { prop: 'vxFilteredData', defValue: [] },
                        { prop: 'xsRowTitleTemplate', defValue: '<div class="xsRowTemplate">{{row[vxColSettings.primaryId]}}</div>' }
                    ];
                    _.each(_propDefns, function (propDefn) {
                        if ($scope.vxConfig[propDefn.prop] === 'undefined' || $scope.vxConfig[propDefn.prop] == null || $scope.vxConfig[propDefn.prop] == {})
                            $scope.vxConfig[propDefn.prop] = propDefn.defValue;
                    });
                    $scope.vxColSettings.selectAllOnRenderAll = $scope.vxConfig.selectAllOnRenderAll;
                    _.each($scope.vxConfig.columnDefConfigs, function (col) {
                        /* SET DEAFULTS FOR COLUMNS */
                        var _propDefns = [
                            { prop: 'renderDefn', defValue: false },
                            { prop: 'ddSort', defValue: false },
                            { prop: 'ddGroup', defValue: false },
                            { prop: 'ddFilters', defValue: false },
                            { prop: 'dropDownEnabled', defValue: false },
                            { prop: 'hidden', defValue: false },
                            { prop: 'xsHidden', defValue: false },
                            { prop: 'locked', defValue: false },
                            { prop: 'primary', defValue: false },
                            { prop: 'width', defValue: '200' },
                            { prop: 'headerDefn', defValue: '' },
                            { prop: 'cellDefn', defValue: '' }
                        ];
                        _.each(_propDefns, function (propDefn) {
                            if (col[propDefn.prop] === 'undefined' || col[propDefn.prop] == null || col[propDefn.prop] == {})
                                col[propDefn.prop] = propDefn.defValue;
                        });
                        var _propDefnLocks = [
                            { prop: 'orderLocked', defValue: false },
                            { prop: 'widthLocked', defValue: false },
                            { prop: 'visbilityLocked', defValue: false }
                        ];
                        _.each(_propDefnLocks, function (propDefn) {
                            if (col[propDefn.prop] === 'undefined' || col[propDefn.prop] == null || col[propDefn.prop] == {})
                                col[propDefn.prop] = col['locked'];
                            else
                                col[propDefn.prop] = col['locked'] || col[propDefn.prop];
                        });
                        $scope.vxColSettings.reverseSettings[col.id] = false;
                        /* SETTING DROPDOWNS LOADED TO FALSE */
                        if (typeof col.dropDownEnabled !== 'undefined' && col.dropDownEnabled != null && col.dropDownEnabled == true && $scope.vxConfig.enableDropdownsInHeader == true) {
                            $scope.vxColSettings.dropdDownEnabled[col.id] = true;
                        }
                        else {
                            $scope.vxColSettings.dropdDownEnabled[col.id] = false;
                        }
                        $scope.vxColSettings.dropdDownLoaded[col.id] = false;
                        $scope.vxColSettings.dropdDownOpen[col.id] = false;
                        if (typeof col.renderDefn !== 'undefined' && col.renderDefn != null && col.renderDefn != {} && col.renderDefn == true) {
                            col.cellDefn = col.cellDefn.replaceAll("VX_ROW_POINT", "row[vxColSettings.primaryId]");
                            col.cellDefn = col.cellDefn.replaceAll("VX_DATA_POINT", "row[header.id]");
                            col.cellDefn = col.cellDefn.replaceAll("VX_ROW", "row");
                        }
                    });
                    /* DEFAULT ORDER PRDIACTE TO PRIMARY */
                    $scope.vxColSettings.predicate = $scope.vxColSettings.primaryId;
                    if (typeof $scope.vxConfig.multiSelectionDependentCol !== 'undefined'
                        && $scope.vxConfig.multiSelectionDependentCol != null
                        && $scope.vxConfig.multiSelectionDependentCol != {}
                        && $scope.vxConfig.multiSelectionDependentCol != '')
                        $scope.vxColSettings.multiSelColDependent = true;
                    if (typeof $scope.vxConfig.xsRowTitleTemplate !== 'undefined'
                                            && $scope.vxConfig.xsRowTitleTemplate != null
                                            && $scope.vxConfig.xsRowTitleTemplate != {}
                                            && $scope.vxConfig.xsRowTitleTemplate != '') {
                        $scope.vxColSettings.xsRowTitleTemplateAvailable = true;
                    }
                    /* GENERATE VX INSTANCE ID AND SEND BACK*/
                    $scope.config.id = $scope.vxConfig.id = _.uniqueId('_vxUID_');
                    /* ADD PROTOTYPE TO CALLBACK FILTERED DATA*/
                    $scope.config.getVxCounts = function () {
                        if (typeof $scope.vxConfig !== 'undefined' && $scope.vxConfig != null && $scope.vxConfig != {} && $scope.vxConfig.id !== 'undefined' && $scope.vxConfig.id != null && $scope.vxConfig.id != {})
                            return {
                                'id': $scope.vxConfig.id,
                                'data': {
                                    'vxAllDataLength': $scope.getAllRowLength(),
                                    'vxFilteredDataLength': $scope.multiBoxFilters.length > 0 ? $scope.vxConfig.vxFilteredData.length : 0,
                                    'vxSelectedDataLength': $scope.vxColSettings.multiSelected.length
                                }
                            }
                        else
                            return undefined;
                    }
                    /* ADD FUNCTION REFERENCE FOR DIRECT CALL*/
                    $scope.config.changeRowClass = $scope.changeRowClass;
                    $scope.$emit('vxGridSettingsBuilt', { 'id': $scope.vxConfig.id });
                }


                $scope.$watch('getWindowDimensions()', function (newValue, oldValue) {
                    if (newValue.w < 768)
                        $scope.vxColSettings.xsViewEnabled = true;
                    else
                        $scope.vxColSettings.xsViewEnabled = false;
                }, true);
                w.bind('resize', function () {
                    $scope.$apply();
                });

                $scope.isValidHeaderName = function (header, name) {
                    return header.renderDefn == false && typeof name !== 'undefined' && name != null && name != '';
                }
                $scope.headerClick = function (header) {
                    var _colDefn = _.find($scope.vxConfig.columnDefConfigs, function (col) { return col.id.localeCompare(header.id) == 0 });
                    if (typeof _colDefn !== 'undefined' && _colDefn != null) {
                        if ($scope.vxColSettings.dropdDownEnabled[_colDefn.id] == false) {
                            /* ENABLING DEFUALT SORT */
                            $scope.sortClick(header);
                        }
                        else {
                            $scope.vxColSettings.dropdDownLoaded[_colDefn.id] = false;
                            $scope.vxColSettings.dropdDownOpen[_colDefn.id] = !$scope.vxColSettings.dropdDownOpen[_colDefn.id];
                            /* CHECK IF INTERSECTED FILTERS NEED TO BE SET TRUE */
                            var _intersect = _.filter($scope.multiBoxFilters, function (mbFilter) { return mbFilter.col.localeCompare(_colDefn.id) != 0 });
                            var processForIntersectedFilters = _intersect.length > 0;
                            /* CHECK IF FILTERS LIST HAS BEEN POPULATED FOR COLUMN */
                            var filterListForColAvailable = false;
                            if (typeof $scope.vxColSettings.colFilterPairs[_colDefn.id] !== 'undefined' && $scope.vxColSettings.colFilterPairs[_colDefn.id] != null && $scope.vxColSettings.colFilterPairs[_colDefn.id] != {} && $scope.vxColSettings.colFilterPairs[_colDefn.id].length > 0) {
                                filterListForColAvailable = true;
                            }
                            /* RESET DISABLED PROPS FOR PREVIOUSLY INTERSECTED DATA SET*/
                            if (processForIntersectedFilters == false && filterListForColAvailable == true) {
                                $scope.vxColSettings.dropdDownLoaded[_colDefn.id] = true;
                                _.each($scope.vxColSettings.colFilterPairs[_colDefn.id], function (pair) { pair.disabled = false; });
                            }
                            else {
                                $timeout(function () {
                                    /* SORT OPERATION */
                                    if (_colDefn.ddSort == true)
                                        $scope.vxColSettings.dropDownSort[_colDefn.id] = true;
                                    if (_colDefn.ddGroup == true)
                                        $scope.vxColSettings.dropDownGroup[_colDefn.id] = true;
                                    /* FILTER OPERATION */
                                    if (_colDefn.ddFilters == true) {
                                        /*  POPULATE LIST OF FILTERS*/
                                        if (filterListForColAvailable == false) {
                                            $scope.vxColSettings.dropDownFilters[_colDefn.id] = true;
                                            $scope.vxColSettings.colFilterPairs[_colDefn.id] = [];
                                            var uniqed = _.uniq(_.map($scope.vxConfig.data, function (item) {
                                                var ret = item[_colDefn.id];
                                                if (typeof ret !== 'undefined' && ret != null && ret != {})
                                                    return ret.trim()
                                                else
                                                    return ret;
                                            }));
                                            uniqed = _.reject(uniqed, function (item) { return typeof item === 'undefined' || item == {} });
                                            _.each(uniqed.sort(), function (item) {
                                                var key = 'col_' + _colDefn.id + '_key_';
                                                if (item == null)
                                                    key = key + 'null';
                                                else
                                                    key = key + (item == null ? 'null' : item.replace(/\s+/g, '_'));
                                                var name = (item == '' || item == ' ' ? '< blank >' : item);
                                                name = item == null ? ' < null >' : name;
                                                var pair = { 'key': key, 'label': item, 'name': name, 'col': _colDefn.id, 'type': 'string', disabled: false, action: 'filter' };
                                                $scope.vxColSettings.colFilterPairs[_colDefn.id].push(pair);
                                                $scope.vxColSettings.colFiltersStatus[key] = false;
                                            });
                                            $scope.vxColSettings.colFiltersActivated[_colDefn.id] = false;
                                        }
                                        /* SET NON INTERSECTED FILTERS TO DISABLE TRUE*/
                                        if (processForIntersectedFilters == true) {
                                            /* GET INTERSECTED DATA SET BY LOOPING THROUGH MATCHES - vxConfig.vxFilteredData */
                                            var lastCol = _.last($scope.multiBoxFilters);
                                            var uniqed = _.uniq(_.map($scope.vxConfig.vxFilteredData, function (item) { return item[_colDefn.id] }));
                                            if (lastCol.col.localeCompare(_colDefn.id) != 0) {
                                                _.each($scope.vxColSettings.colFilterPairs[_colDefn.id], function (pair) {
                                                    if (_.contains(uniqed, pair.label) != true)
                                                        pair.disabled = true;
                                                    else
                                                        pair.disabled = false;
                                                });
                                            }
                                        }
                                    }
                                    $scope.vxColSettings.dropdDownLoaded[_colDefn.id] = true;
                                }, 500);
                            }
                        }
                    }
                }
                $scope.sortClick = function (header) {
                    var _colDefn = _.find($scope.vxConfig.columnDefConfigs, function (col) { return col.id.localeCompare(header.id) == 0 });
                    if (typeof _colDefn !== 'undefined' && _colDefn != null) {
                        if (_colDefn.ddSort) {
                            if ($scope.vxColSettings.predicate.localeCompare(_colDefn.id) != 0)
                                $scope.vxColSettings.predicate = _colDefn.id;
                            $scope.vxColSettings.reverseSettings[_colDefn.id] = !$scope.vxColSettings.reverseSettings[_colDefn.id];
                            $scope.vxColSettings.reverse = $scope.vxColSettings.reverseSettings[_colDefn.id];
                        }
                    }
                }
                $scope.getVisibleHeaderCounts = function () {
                    return _.filter($scope.vxConfig.columnDefConfigs, function (col) { return col.hidden != true }).length;
                }
                $scope.groupClick = function (header) {
                    $scope.clearFilters();
                    $scope.removeGroupings();
                    if ($scope.vxColSettings.groupByColActivated[header.id] != true) {
                        $scope.vxColSettings.predicate = null;
                        var collection = [];
                        var groupByProp = header.id;
                        var groupColName = header.columnName;
                        var groupPropValues = _.uniq(_.pluck($scope.vxConfig.data, groupByProp));
                        _.each(groupPropValues, function (value) {
                            var group = _.filter($scope.vxConfig.data, function (i) { return i[groupByProp].localeCompare(value) == 0 });
                            if (group.length > 0) {
                                var groupId = 'groupcol_' + groupByProp + '_key_' + value.replace(/\s+/g, '_');
                                $scope.vxColSettings.groupPredicate[groupId] = false;
                                var rowDefn = { 'type': 'groupRow', 'colName': groupColName, 'col': groupByProp, 'value': value, 'groupId': groupId, 'cellDefn': '<div class="vx-row-select"><input class="vx-row-select-toggle" type="checkbox" ng-model="VX_ROW_POINT" ng-change="groupSelectionChanged(row)" /></div>' };
                                rowDefn.cellDefn = rowDefn.cellDefn.replaceAll("VX_ROW_POINT", "vxColSettings.groupPredicate[row.groupId]");
                                collection.push(rowDefn);
                                collection = _.union(collection, group);
                            }
                        });
                        $scope.vxConfig.data = collection;
                        $scope.vxColSettings.groupByColActivated[header.id] = true;
                    }
                }
                $scope.unGroupClick = function (header) {
                    $scope.clearFilters();
                    if ($scope.vxColSettings.groupByColActivated[header.id] == true) {
                        $scope.vxColSettings.predicate = header.id;
                        $scope.vxConfig.data = _.reject($scope.vxConfig.data, function (row) {
                            if (typeof row.type !== 'undefined' && row.type != null)
                                return row.type.localeCompare('groupRow') == 0
                            else
                                return false
                        });
                        $scope.vxColSettings.groupByColActivated[header.id] = false;
                    }
                }
                $scope.getAllRowLength = function () {
                    var len = _.filter($scope.vxConfig.data, function (row) {
                        return typeof row.type == 'undefined' || row.type == null || row.type.localeCompare('groupRow') != 0
                    }).length;
                    return len;
                }
                $scope.removeGroupings = function () {
                    _.each($scope.vxConfig.columnDefConfigs, function (header) {
                        $scope.unGroupClick(header);
                    });
                    $scope.vxColSettings.groupPredicate = {};
                }
                $scope.clearGroupingForHeader = function (header) {
                    $scope.multiBoxFilters = _.reject($scope.multiBoxFilters, function (pair) { return pair.col.localeCompare(header.id) == 0 });
                }
                $scope.groupSelectionChanged = function (group) {
                    $scope.emitArray = [];
                    var toggledTo = $scope.vxColSettings.groupPredicate[group.groupId];
                    _.each(_.filter($scope.vxConfig.vxFilteredData, function (row) {
                        return row.type != 'groupRow' && row[group.col].localeCompare(group.value) == 0
                    }), function (row) {
                        if ($scope.vxColSettings.multiSelColDependent == false || ($scope.vxColSettings.multiSelColDependent == true && row[$scope.vxConfig.multiSelectionDependentCol] == false)) {
                            var pid = row[$scope.vxColSettings.primaryId];
                            if ($scope.vxColSettings.rowSelected[pid] != toggledTo) {
                                $scope.vxColSettings.rowSelected[pid] = toggledTo;
                                var result = { 'key': row[$scope.vxConfig.onSelectionReturnCol], 'value': $scope.vxColSettings.rowSelected[pid], '_pKey': pid };
                                $scope.emitArray.push(pid);
                                if (toggledTo)
                                    $scope.vxColSettings.multiSelected.push(pid);
                                else
                                    $scope.vxColSettings.multiSelected = _.reject($scope.vxColSettings.multiSelected, function (rs) { return rs.localeCompare(pid) != 0 });
                            }
                        }
                    });
                    $scope.$emit('vxGridRowSelectionChange', { 'id': $scope.vxConfig.id, 'data': $scope.emitArray });

                }
                $scope.rowSelectionChanged = function (row) {
                    var pid = row[$scope.vxColSettings.primaryId];
                    var result = { 'key': row[$scope.vxConfig.onSelectionReturnCol], 'value': $scope.vxColSettings.rowSelected[pid], '_pKey': pid };
                    var proceed = true;
                    if ($scope.vxColSettings.rowSelected[pid] == true && $scope.vxColSettings.multiSelColDependent == true) {
                        proceed = false;
                        var colId = $scope.vxConfig.multiSelectionDependentCol;
                        if (row[colId] == true && $scope.vxColSettings.multiSelected.length == 0)
                            proceed = true;
                        else if (row[colId] == false && $scope.vxColSettings.multiSelected.length >= 1) {
                            var id = $scope.vxColSettings.multiSelected[0];
                            var dataRow = _.find($scope.vxConfig.data, function (i) { return i[$scope.vxColSettings.primaryId].localeCompare(id) == 0 });
                            if (typeof dataRow !== 'undefined' && dataRow != null && dataRow != {} && dataRow[colId] == true) {
                                proceed = false;
                                $scope.vxColSettings.rowSelected[pid] = false;
                            }
                            else
                                proceed = true;
                        }
                        else if (row[colId] == false)
                            proceed = true;
                        else
                            $scope.vxColSettings.rowSelected[pid] = false;
                    }
                    else if ($scope.vxColSettings.rowSelected[pid] == false) {
                        $scope.vxColSettings.multiSelected = _.reject($scope.vxColSettings.multiSelected, function (rs) { return rs.localeCompare(pid) == 0 });
                        proceed = false;
                        $scope.$emit('vxGridRowSelectionChange', { 'id': $scope.vxConfig.id, 'data': result });
                    }
                    if (proceed) {
                        var item = _.find($scope.vxColSettings.multiSelected, function (rs) { return rs.localeCompare(pid) == 0 });
                        if (typeof item === 'undefined' || item == null)
                            $scope.vxColSettings.multiSelected.push(pid);
                        $scope.$emit('vxGridRowSelectionChange', { 'id': $scope.vxConfig.id, 'data': result });
                        /* PROCESS FOR MULTI SELECT FALSE */
                        if ($scope.vxConfig.multiSelectionEnabled == false) {
                            _.each($scope.vxColSettings.multiSelected, function (rs) {
                                if (rs.localeCompare(pid) != 0) {
                                    $scope.vxColSettings.rowSelected[rs] = false;
                                }
                            });
                            $scope.vxColSettings.multiSelected = _.reject($scope.vxColSettings.multiSelected, function (rs) { return rs.localeCompare(pid) != 0 });
                        }
                    }
                }

                $scope.filterClick = function (header, filter) {
                    $scope.clearSelection();
                    var filterValue = $scope.vxColSettings.colFiltersStatus[filter.key];
                    if (filterValue == false) {
                        $scope.multiBoxFilters = _.reject($scope.multiBoxFilters, function (mbFilter) { return mbFilter.key.localeCompare(filter.key) == 0 });
                        var colFilterActivatedAlready = _.find($scope.multiBoxFilters, function (mbFilter) { return mbFilter.col.localeCompare(filter.col) == 0 });
                        if (typeof colFilterActivatedAlready === 'undefined' || colFilterActivatedAlready == null || colFilterActivatedAlready == {} || colFilterActivatedAlready.length == 0)
                            $scope.vxColSettings.colFiltersActivated[header.id] = false;
                    }
                    else {
                        var filterExists = _.find($scope.multiBoxFilters, function (mbFilter) { return mbFilter.key.localeCompare(filter.key) == 0 });
                        if (typeof filterExists === 'undefined' || filterExists == null || filterExists == {}) {
                            $scope.multiBoxFilters.push(filter);
                        }
                        $scope.vxColSettings.colFiltersActivated[header.id] = true;
                    }
                }
                $scope.filterClearClick = function (header) {
                    if ($scope.vxColSettings.colFiltersActivated[header.id] == true) {
                        $scope.clearSelection();
                        var colFilterActivatedAlready = _.filter($scope.multiBoxFilters, function (mbFilter) { return mbFilter.col.localeCompare(header.id) == 0 });
                        if (colFilterActivatedAlready.length > 0) {
                            _.each(colFilterActivatedAlready, function (mbFilter) {
                                $scope.vxColSettings.colFiltersStatus[mbFilter.key] = false;
                            });
                        }
                        $scope.multiBoxFilters = _.reject($scope.multiBoxFilters, function (mbFilter) { return mbFilter.col.localeCompare(header.id) == 0 });
                        $scope.vxColSettings.colFiltersActivated[header.id] = false;
                    }
                }
                $scope.clearFilters = function () {
                    if ($scope.multiBoxFilters.length > 0) {
                        _.each($scope.vxConfig.columnDefConfigs, function (col) {
                            $scope.filterClearClick(col);
                        });
                    }
                    $scope.multiBoxFilters = [];
                }
                $scope.selectAllFiltered = function () {
                    if ($scope.vxColSettings.multiSelected.length > 0) {
                        $scope.clearSelection();
                    }
                    $scope.emitArray = [];
                    _.each($scope.vxConfig.vxFilteredData, function (row) {
                        if ($scope.vxColSettings.multiSelColDependent == false || ($scope.vxColSettings.multiSelColDependent == true && row[$scope.vxConfig.multiSelectionDependentCol] == false)) {
                            $scope.vxColSettings.rowSelected[row[$scope.vxColSettings.primaryId]] = true;
                            var pid = row[$scope.vxColSettings.primaryId];
                            var result = { 'key': row[$scope.vxConfig.onSelectionReturnCol], 'value': $scope.vxColSettings.rowSelected[pid], '_pKey': pid };
                            $scope.emitArray.push(result);

                            /* MAINTAIN LIST OF SELECTED ROWS */
                            if ($scope.vxColSettings.rowSelected[pid] == true) {
                                var item = _.find($scope.vxColSettings.multiSelected, function (rs) { return rs.localeCompare(pid) == 0 });
                                if (typeof item === 'undefined' || item == null)
                                    $scope.vxColSettings.multiSelected.push(pid);
                            }
                        }
                    });
                    $scope.$emit('vxGridRowMultiSelectionChange', { 'id': $scope.vxConfig.id, 'data': $scope.emitArray });
                }
                $scope.clearSelection = function () {
                    $scope.emitArray = [];
                    _.each($scope.vxColSettings.multiSelected, function (pid) {
                        $scope.vxColSettings.rowSelected[pid] = false;
                        var row = _.find($scope.vxConfig.data, function (r) { return r[$scope.vxColSettings.primaryId].localeCompare(pid) == 0 });
                        if (typeof row !== 'undefined' && row != null) {
                            var result = { 'key': row[$scope.vxConfig.onSelectionReturnCol], 'value': $scope.vxColSettings.rowSelected[pid], '_pKey': pid };
                            $scope.emitArray.push(result);
                        }
                        //$scope.$emit('vxGridRowSelectionChange', result);
                        $scope.vxColSettings.multiSelected = [];
                    });
                    $scope.$emit('vxGridRowMultiSelectionChange', { 'id': $scope.vxConfig.id, 'data': $scope.emitArray });
                }
                $scope.openManageColumns = function () {
                    var modalInstance = $modal.open({
                        templateUrl: 'Controls/demo/grid/src/vxGrid/vx-grid-manage-columns-modal.html',
                        //templateUrl: '/Scripts/vx-grid/vx-grid-manage-columns-modal.html',
                        windowClass: 'vxGridManageColMod',
                        controller: ["$scope", "$modalInstance", "originalSettings", function ($scope, $modalInstance, originalSettings) {
                            $scope.headerSelected = null;
                            $scope.headerSelectedForVisChange = null;
                            $scope.copyForWidthVisChange = originalSettings;
                            _.each($scope.copyForWidthVisChange, function (col, i) {
                                col.order = i;
                                col.chars = Math.ceil((col.width - 20) / 7);
                                col.selected = false;
                            });
                            $scope.swapAbove = function (header) {
                                if (header.locked == false) {
                                    var swapFrom = header.order;
                                    var swapTo = header.order;
                                    var stableSwap = true;
                                    do {
                                        swapTo = swapTo - 1;
                                        stableSwap = true;
                                        var headerSwappable = _.find($scope.copyForWidthVisChange, function (head) { return head.order == swapTo && head.orderLocked == false });
                                        if (typeof headerSwappable === 'undefined' || headerSwappable == null || headerSwappable == {})
                                            stableSwap = false;
                                    } while (!stableSwap && swapTo >= 0);
                                    if (stableSwap && swapTo >= 0) {
                                        var headerSwappable = _.find($scope.copyForWidthVisChange, function (head) { return head.order == swapTo && head.orderLocked == false });
                                        if (typeof headerSwappable !== 'undefined' && headerSwappable != null && headerSwappable != {}) {
                                            headerSwappable.order = swapFrom;
                                            header.order = swapTo;
                                        }
                                    }
                                }
                            }
                            $scope.swapBelow = function (header) {
                                if (header.locked == false) {
                                    var swapFrom = header.order;
                                    var swapTo = header.order;
                                    var stableSwap = true;
                                    do {
                                        swapTo = swapTo + 1;
                                        stableSwap = true;
                                        var headerSwappable = _.find($scope.copyForWidthVisChange, function (head) { return head.order == swapTo && head.orderLocked == false });
                                        if (typeof headerSwappable === 'undefined' || headerSwappable == null || headerSwappable == {})
                                            stableSwap = false;
                                    } while (!stableSwap && swapTo <= $scope.copyForWidthVisChange.length - 1);
                                    if (stableSwap && swapTo <= $scope.copyForWidthVisChange.length - 1) {
                                        var headerSwappable = _.find($scope.copyForWidthVisChange, function (head) { return head.order == swapTo && head.orderLocked == false });
                                        if (typeof headerSwappable !== 'undefined' && headerSwappable != null && headerSwappable != {}) {
                                            headerSwappable.order = swapFrom;
                                            header.order = swapTo;
                                        }
                                    }
                                }
                            }
                            $scope.makeVisible = function (head) {
                                var header = _.find($scope.copyForWidthVisChange, function (i) { return i.id.localeCompare(head.id) == 0 });
                                if (typeof header !== 'undefined' && header != null && header != {} && header.visbilityLocked == false)
                                    header.hidden = false;
                            }
                            $scope.makeHidden = function (head) {
                                var header = _.find($scope.copyForWidthVisChange, function (i) { return i.id.localeCompare(head.id) == 0 });
                                if (typeof header !== 'undefined' && header != null && header != {} && header.visbilityLocked == false)
                                    header.hidden = true;
                            }
                            $scope.saveChangeInConfig = function () {
                                var newConfig = [];
                                newConfig = _.sortBy($scope.copyForWidthVisChange, function (col) {
                                    var column = _.find($scope.copyForWidthVisChange, function (item) { return item.id.localeCompare(col.id) == 0 });
                                    if (typeof column !== 'undefined' && column != null && column != {})
                                        return column.order
                                    else
                                        return 1;
                                });
                                $modalInstance.close(newConfig);
                            }
                            $scope.widthChanged = function (header) {
                                header.width = Math.ceil(header.chars * 7) + 20;
                            }
                            $scope.selectHeader = function (header) {
                                if (header.locked == true)
                                    return;
                                header.selected = !header.selected;
                                _.each($scope.copyForWidthVisChange, function (col) {
                                    if (col.id.localeCompare(header.id) != 0)
                                        col.selected = false;
                                });
                                if (header.selected == true) {
                                    $scope.headerSelected = header;
                                }
                                else {
                                    $scope.headerSelected = null;
                                }
                            }
                            $scope.cancelChangeInConfig = function () {
                                $modalInstance.dismiss();
                            }
                        }],
                        backdrop: 'static',
                        resolve: {
                            originalSettings: function () {
                                return angular.copy($scope.vxConfig.columnDefConfigs);
                            }
                        }
                    });
                    modalInstance.result.then(function (data) {
                        /* GET MODIFIED CHANGES FOPR CONFIG */
                        $scope.vxConfig.columnDefConfigs = data;
                        $scope.$emit('vxGridSettingsChanged', { 'id': $scope.vxConfig.id, 'data': data });
                    }, function (data) {
                    });
                }
                $scope.outsideHeaderClick = function (header) {
                    if ($scope.vxColSettings.dropdDownOpen[header.id] == true)
                        $scope.vxColSettings.dropdDownOpen[header.id] = false;
                }
                $scope.revealWrapToggle = function () {
                    $scope.vxColSettings.revealWrapRowData = !$scope.vxColSettings.revealWrapRowData;
                }
                $scope.xsReset = function () {
                    $scope.vxColSettings.xsSearch = '';
                }
                $scope.justScrollTop = function () {
                    var element = $scope.selfEle.find('.vxTableContainer');
                    $timeout(function () {
                        $(element).animate({ scrollTop: 0 }, 500);
                    }, 100);
                }
                $scope.$on('vsRepeatCollectionPartiallyRendered', function (e, data) {
                    $scope.$emit('vxPartiallyRendered', { 'id': $scope.vxConfig.id, 'data': data });
                    if ($scope.vxConfig.selectAllOnRenderAll == true) {
                        $scope.vxColSettings.selectAllEnabled = false;
                        $scope.$emit('vxPartiallyRenderedSelectAllDisabled', { 'id': $scope.vxConfig.id, 'data': data });
                    }
                });
                $scope.$on('vsRepeatCollectionCompletelyRendered', function (e, data) {
                    $scope.$emit('vxCompletelyRendered', { 'id': $scope.vxConfig.id, 'data': data });
                    if ($scope.vxConfig.selectAllOnRenderAll == true) {
                        $scope.vxColSettings.selectAllEnabled = true;
                        $scope.$emit('vxCompletelyRenderedSelectAllEnabled', { 'id': $scope.vxConfig.id, 'data': data });
                    }
                });
                var comEvOnEvent = ['openManageColumns', 'resetVxInstance', 'clearFilters', 'selectAllFiltered', 'clearSelection', 'revealWrapToggle'];
                _.each(comEvOnEvent, function (evName) {
                    var captureEvName = 'vxGrid' + evName.capitalizeFirstLetter();
                    var fireEvent = evName + '()';
                    $scope.$on(captureEvName, function (e, data) {
                        if (data.id.localeCompare($scope.vxConfig.id) == 0)
                            $scope.$eval(fireEvent);
                    })
                });
                $scope.$on('vxGridChangeRowClass', function (e, data) {
                    $scope.changeRowClass(data);
                });
                $scope.changeRowClass = function (data) {
                    if (data.id.localeCompare($scope.vxConfig.id) == 0) {
                        _.each(data.data, function (pair) {
                            $scope.vxColSettings.vxRowClass[pair.key] = pair.value;
                        });
                    }
                }
                $scope.$on('vxGridResetRowClass', function (e, data) {
                    if (data.id.localeCompare($scope.vxConfig.id) == 0)
                        $scope.vxColSettings.vxRowClass = {};
                });
                $scope.$on('vxGridDisableRowSelection', function (e, data) {
                    if (data.id.localeCompare($scope.vxConfig.id) == 0) {
                        _.each(data.data, function (pair) {
                            $scope.vxColSettings.vxRowSelectionDisable[pair.key] = pair.value;
                        });
                    }
                });
                $scope.$on('vxGridResetDisableRowSelection', function (e, data) {
                    if (data.id.localeCompare($scope.vxConfig.id) == 0) {
                        for (var key in $scope.vxColSettings.vxRowSelectionDisable)
                            $scope.vxColSettings.vxRowSelectionDisable[key] = false;
                    }
                });
            }],
            replace: true,
            templateUrl: 'Controls/demo/grid/src/vxGrid/vx-grid.html',
            /*templateUrl: '/Scripts/vx-grid/vx-grid.html',*/
            link: function ($scope, element, attributes) {
                $scope.selfEle = element;
                /* BUILD COL SETTINGS */
                //$scope.resetVxInstance();
                $scope.$watchCollection('config.data', function (n) {
                    $scope.resetVxInstance();
                });
            }
        };
    })
    .directive("vxCompile", ["$compile", function ($compile) {
        return function (scope, element, attrs) {
            scope.$watch(
              function (scope) {
                  // watch the 'compile' expression for changes
                  return scope.$eval(attrs.vxCompile);
              },
              function (value) {
                  // when the 'compile' expression changes
                  // assign it into the current DOM
                  element.html(value);

                  // compile the new DOM and link it to the current
                  // scope.
                  // NOTE: we only compile .childNodes so that
                  // we don't get into infinite loop compiling ourselves
                  $compile(element.contents())(scope);
              }
          );
        }
    }])
    .directive("vxCompileCloneLink", ["$compile", function ($compile) {
        var compileCache = {};
        var evalCache = {};
        return function (scope, element, attrs) {
            var forEvaled = null;
            if (attrs.vxCompileCloneLink in compileCache) {
                forEvaled = evalCache[attrs.vxCompileCloneLink];
            }
            else {
                evalCache[attrs.vxCompileCloneLink] = scope.$eval(attrs.vxCompileCloneLink);
                forEvaled = evalCache[attrs.vxCompileCloneLink];
            }
            var forLink = null;
            if (forEvaled in compileCache) {
                forLink = compileCache[forEvaled];
            }
            else {
                compileCache[forEvaled] = $compile(forEvaled);
                forLink = compileCache[forEvaled];
            }
            forLink(scope, function (clonedElement, scope) {
                element.append(clonedElement);
            })
        }
    }])
    .directive("vxKey", function () {
        return {
            restrict: 'AEC',
            scope: {
                vxKey: '&'
            },
            link: function ($scope, elem, attr) {
                elem.on('click', function (e) {
                    $scope.$apply($scope.vxKey);
                });
                elem.on('keyup', function (e) {
                    if (e.keyCode == 13 || e.keyCode == 32)
                        $scope.$apply($scope.vxKey);
                });
            }
        };
    })
    .filter("vxGridMultiBoxFilters", function () {
        return function (items, criteria) {
            if (typeof criteria !== 'undefined' && criteria != null && criteria.length > 0) {
                var filtered = items;
                var copyOfItems = items;
                var filterGroups = _.groupBy(criteria, 'col');
                for (var columnFound in filterGroups) {
                    var matches = filterGroups[columnFound];
                    var unionedMatches = [];
                    _.each(matches, function (match) {
                        unionedMatches = _.union(unionedMatches, _.filter(copyOfItems, function (item) {
                            if (typeof match.label !== 'undefined' && match.label != null && match.label != {} && typeof item[match.col] !== 'undefined' && item[match.col] != null && item[match.col] != {}) {
                                return item[match.col].toString().trim().localeCompare(match.label) == 0;
                            }
                            else
                                return item[match.col] == match.label;
                        }));
                    });
                    filtered = _.intersection(filtered, unionedMatches);
                }
                return filtered;
            }
            else
                return items;
        };
    })
    .filter("vxNumberFixedLen", function () {
        return function (n, len) {
            var num = parseInt(n, 10);
            len = parseInt(len, 10);
            if (isNaN(num) || isNaN(len)) {
                return n;
            }
            num = '' + num;
            while (num.length < len) {
                num = '0' + num;
            }
            return num;
        };
    })
    .run(["$templateCache", function ($templateCache) {
        $templateCache.put("template/vx-grid/vx-grid-manage-columns-modal.html",
        '<div class="modal-body">' +
        '    <div class="vxTableSettings">' +
        '        <div class="vxSettingsHead">' +
        '            <label class="title">Mange Columns</label>' +
        '            <div class="icon-container" role="button" tabindex="0" vx-key="cancelChangeInConfig()">' +
        '                <i class="icon icon-close"></i>' +
        '            </div>' +
        '        </div>' +
        '        <div class="vxSettingsBody">' +
        '            <div class="col-xs-12 zeroPadding vxH100">' +
        '                <div class="col-xs-3 vxH100 visHideRows">' +
        '                    <div class="row vxH100">' +
        '                        <div class="col-xs-12 columns">' +
        '                            <label class="help">Available Columns</label>' +
        '                            <p class="helpText">Select a column use the left and right arrows to change column visibility.</p>' +
        '                            <div class="col-xs-12 colItem" tabindex="{{header.locked == false ? 0 : -1}}" ng-repeat="header in copyForWidthVisChange" ng-class="{ \'locked\': header.locked, \'selected\': header.id == headerSelected.id}" vx-key="selectHeader(header)" ng-if="header.hidden == true">' +
        '                                <div class="col-xs-2 col-sm-2 col-md-1">' +
        '                                    <label class="colLabel xl" ng-if="header.visbilityLocked == true"><span class="icon icon-blockedLegacy" tooltip="Visbility Locked" style="font-family: \'Segoe UI MDL Symbol\'"></span></label>' +
        '                                </div>' +
        '                                <label class="col-xs-10 col-sm-10 col-md-10 colName">{{header.columnName}}</label>' +
        '                                <div class="clearfix"></div>' +
        '                            </div>' +
        '                            <div class="clearfix"></div>' +
        '                        </div>' +
        '                        <div class="clearfix"></div>' +
        '                    </div>' +
        '                </div>' +
        '                <div class="col-xs-1 vxH100 visChangers">' +
        '                    <div class="col-xs-12 visChangersContainer">' +
        '                        <div class="col-xs-12 visChangersItem zeroPadding">' +
        '                            <div class="icon-container" role="button" tabindex="{{headerSelected.visbilityLocked || headerSelected == null || headerSelected.hidden == false ? -1 : 0}}" ng-class="{\'disabled\' : headerSelected.visbilityLocked || headerSelected == null || headerSelected.hidden == false}" vx-key="makeVisible(headerSelected)">' +
        '                                <i class="icon icon-right"></i>' +
        '                            </div>' +
        '                        </div>' +
        '                        <div class="col-xs-12 visChangersItem zeroPadding">' +
        '                            <div class="icon-container" role="button" tabindex="{{headerSelected.visbilityLocked || headerSelected == null || headerSelected.hidden == true ? -1 : 0}}" ng-class="{\'disabled\' : headerSelected.visbilityLocked || headerSelected == null || headerSelected.hidden == true}" vx-key="makeHidden(headerSelected)">' +
        '                                <i class="icon icon-left"></i>' +
        '                            </div>' +
        '                        </div>' +
        '                        <div class="clearfix"></div>' +
        '                    </div>' +
        '                </div>' +
        '                <div class="col-xs-7 vxH100">' +
        '                    <div class="row orderChanger">' +
        '                        <div class="col-xs-12 columns">' +
        '                            <label class="help">Selected Columns</label>' +
        '                            <p class="helpText">Select a column and use the up and down arrows to change column order.</p>' +
        '                            <div class="col-xs-12 colItem" tabindex="{{header.locked == true || (header.locked == false && header.visbilityLocked == true && header.orderLocked == true) ? -1 : 0}}" ng-repeat="header in copyForWidthVisChange | orderBy: \'order\'" ng-class="{ \'locked\': header.locked, \'selected\': header.id == headerSelected.id}" vx-key="selectHeader(header)" ng-if="header.hidden == false">' +
        '                                <div class="col-xs-12 col-sm-6 col-md-2 padA0L10R0">' +
        '                                    <div class="col-xs-4 pad0">' +
        '                                        <label class="colLabel xl" ng-if="header.visbilityLocked == true"><span class="icon icon-blockedLegacy" tooltip="Visbility Locked" style="font-family: \'Segoe UI MDL Symbol\'"></span></label>' +
        '                                    </div>' +
        '                                    <div class="col-xs-4 pad0">' +
        '                                        <label class="colLabel xl" ng-if="header.orderLocked == true"><span class="icon icon-unpin" tooltip="Order Locked" style="font-family: \'Segoe UI MDL Symbol\'"></span></label>' +
        '                                    </div>' +
        '                                    <div class="col-xs-4 pad0">' +
        '                                        <label class="colLabel xl" ng-if="header.widthLocked == true"><span class="icon icon-trim" tooltip="Width Locked" style="font-family: \'Segoe UI MDL Symbol\'"></span></label>' +
        '                                    </div>' +
        '                                </div>' +
        '                                <label class="col-xs-12 col-sm-12 col-md-4 colName">{{header.columnName}}</label>' +
        '                                <div class="col-xs-12 col-sm-6 col-md-6">' +
        '                                    <label class="colLabel">Width (in approx. char)</label>' +
        '                                    <input class="inputStyle colInput" ng-model="header.chars" ng-disabled="header.widthLocked" ng-change="widthChanged(header)" />' +
        '                                </div>' +
        '                                <div class="clearfix"></div>' +
        '                            </div>' +
        '                            <div class="clearfix"></div>' +
        '                        </div>' +
        '                        <div class="clearfix"></div>' +
        '                    </div>' +
        '                </div>' +
        '                <div class="col-xs-1 vxH100 visChangers">' +
        '                    <div class="col-xs-12 visChangersContainer">' +
        '                        <div class="col-xs-12 visChangersItem zeroPadding">' +
        '                            <div class="icon-container" role="button" tabindex="{{headerSelected.orderLocked || headerSelected.hidden || headerSelected == null ? -1 : 0}}" ng-class="{\'disabled\' : headerSelected.orderLocked || headerSelected.hidden || headerSelected == null}" vx-key="swapAbove(headerSelected)">' +
        '                                <i class="icon icon-up"></i>' +
        '                            </div>' +
        '                        </div>' +
        '                        <div class="col-xs-12 visChangersItem zeroPadding">' +
        '                            <div class="icon-container" role="button" tabindex="{{headerSelected.orderLocked || headerSelected.hidden || headerSelected == null ? -1 : 0}}" ng-class="{\'disabled\' : headerSelected.orderLocked || headerSelected.hidden || headerSelected == null}" vx-key="swapBelow(headerSelected)">' +
        '                                <i class="icon icon-down"></i>' +
        '                            </div>' +
        '                        </div>' +
        '                        <div class="clearfix"></div>' +
        '                    </div>' +
        '                    <div class="clearfix"></div>' +
        '                </div>' +
        '            </div>' +
        '        </div>' +
        '        <div class="vxSettingsFooter">' +
        '            <button class="btn btn-primary vsTableButton active" ng-click="saveChangeInConfig()">Save</button>' +
        '            <button class="btn btn-primary vsTableButton" ng-click="cancelChangeInConfig()">Cancel</button>' +
        '            <div class="infoBtns">' +
        '                <span class="icon icon-blockedLegacy" style="font-family: \'Segoe UI MDL Symbol\'"></span>' +
        '                <span class="infoLabel">Visbility Locked,</span>' +
        '                <span class="icon icon-unpin" style="font-family: \'Segoe UI MDL Symbol\'"></span>' +
        '                <span class="infoLabel">Order Locked,</span>' +
        '                <span class="icon icon-trim" style="font-family: \'Segoe UI MDL Symbol\'"></span>' +
        '                <span class="infoLabel">Width Locked</span>' +
        '            </div>' +
        '        </div>' +
        '    </div>' +
        '</div>'
            );
        $templateCache.put("template/vx-grid/vx-grid.html",    
        '<div class="vxH100" ng-class="{ \'vxXsViewEnabled\' : vxColSettings.xsViewEnabled == true}">'+
        '    <div class="row hidden-xs">'+
        '        <div class="col-xs-12">'+
        '            <div class="col-md-6 vsTableStats pull-left zeroPaddingLeft" ng-if="vxConfig.showGridStats">'+
        '                <label class="statTitle">All</label>'+
        '                <label class="statValue">{{getAllRowLength() | vxNumberFixedLen:2}}</label>'+
        '                <label class="statTitle" ng-class="{ \'disabled\' : multiBoxFilters.length == 0}">Filtered</label>'+
        '                <label class="statValue" ng-class="{ \'disabled\' : multiBoxFilters.length == 0}"><span ng-if="multiBoxFilters.length > 0">{{vxConfig.vxFilteredData.length | vxNumberFixedLen:2}}</span><span ng-if="multiBoxFilters.length == 0">00</span></label>'+
        '                <label class="statTitle" ng-class="{ \'disabled\' : vxColSettings.multiSelected.length == 0}">Selected</label>'+
        '                <label class="statValue" ng-class="{ \'disabled\' : vxColSettings.multiSelected.length == 0}">{{vxColSettings.multiSelected.length | vxNumberFixedLen:2}}</label>'+
        '            </div>'+
        '            <div class="col-md-6 vxTableOperations pull-right zeroPaddingRight" ng-if="vxConfig.showGridOptions">'+
        '                <div class="icon-container pull-right" role="button" tabindex="0" ng-class="{\'active\' : vxColSettings.menu }" vx-key="openManageColumns()">'+
        '                    <i class="icon icon-repair"></i>'+
        '                </div>'+
        '                <div class="icon-container pull-right" role="button" tabindex="{{multiBoxFilters.length == 0 ? -1 : 0}}" ng-class="{ \'disabled\' : multiBoxFilters.length == 0}" vx-key="clearFilters()">'+
        '                    <i class="icon icon-refresh"></i>'+
        '                </div>'+
        '                <div class="icon-container pull-right" role="button" tabindex="0" ng-class="{\'active\' : vxColSettings.revealWrapRowData }" vx-key="revealWrapToggle()">'+
        '                    <i class="icon icon-more"></i>'+
        '                </div>'+
        '                <div class="icon-container pull-right" role="button" tabindex="{{vxColSettings.multiSelected.length == 0 ? -1 : 0 }}" ng-class="{ \'disabled\' : vxColSettings.multiSelected.length == 0}" vx-key="clearSelection()">'+
        '                    <i class="icon icon-clearselection"></i>'+
        '                </div>'+
        '                <div class="icon-container pull-right" role="button" tabindex="{{vxColSettings.selectAllEnabled == false && vxConfig.multiSelectionEnabled == true ? -1 : 0}}" ng-class="{ \'disabled\' :vxColSettings.selectAllEnabled == false && vxConfig.multiSelectionEnabled == true}" vx-key="selectAllFiltered()">'+
        '                    <i class="icon icon-openwith"></i>'+
        '                </div>'+
        '            </div>'+
        '        </div>'+
        '    </div>'+
        '    <div class="col-md-12 vxTableContainer ms-datatable ang-dt zeroPadding" ng-class="{ \'settingsMenuOpen\': vxColSettings.menu, \'attrPaneOpen\': vxConfig.showGridStats || vxConfig.showGridOptions}">'+
        '        <div class=\'row marg0\'>'+
        '            <div class="col-xs-12 vxTableHolder pad0">'+
        '                <table class="vxTable">'+
        '                    <thead class="vxHead">'+
        '                        <tr class="vxHeadRow">'+
        '                            <th class="vxHeadRowCell" ng-repeat="header in vxConfig.columnDefConfigs" ng-click="headerClick(header)" ng-class="{ \'ddEnabled\' : vxColSettings.dropdDownEnabled[header.id] == true}" tabindex="0" click-outside="outsideHeaderClick(header)" ng-attr-id="vxHead_{{$index}}" ng-style="{ \'width\' : header.width + \'px\' }" ng-if="header.hidden == false && vxColSettings.xsViewEnabled == false">'+
        '                                <span ng-if="isValidHeaderName(header, header.columnName) && vxColSettings.dropdDownEnabled[header.id] == false && header.renderDefn == false">{{header.columnName}}</span>'+
        '                                <div class="dropdown" data-container="body" ng-if="vxColSettings.dropdDownEnabled[header.id] == true && header.renderDefn == false" ng-class="{ \'open\' : vxColSettings.dropdDownOpen[header.id] == true}">'+
        '                                    <button class="btn btn-default dropdown-toggle" type="button" ng-attr-id="ddMenu_{{header.id}}" aria-expanded="true">'+
        '                                        <span class="colTitle">{{header.columnName}}</span>'+
        '                                        <span class="ddCaret" style="font-family: \'Segoe UI MDL Symbol\'" ng-show="vxColSettings.colFiltersActivated[header.id] != true"></span>'+
        '                                        <span class="ddCaret" style="font-family: \'Segoe UI MDL Symbol\'" ng-show="vxColSettings.colFiltersActivated[header.id] == true"></span>'+
        '                                    </button>'+
        '                                    <ul class="dropdown-menu" role="menu" aria-labelledby="ddMenu_{{header.id}}" data-container="body">'+
        '                                        <li tabindex="0" role="presentation" class="loader" ng-if="vxColSettings.dropdDownLoaded[header.id] == false">'+
        '                                            <img class="dropDownLoader" src="/Content/img/loaderWhite36.GIF" alt="dropdown addition in progress" />'+
        '                                        </li>'+
        '                                        <li tabindex="0" role="presentation" class="sorter" ng-if="vxColSettings.dropdDownLoaded[header.id] == true && vxColSettings.dropDownSort[header.id] == true" ng-click="sortClick(header)">'+
        '                                            <span class="sortIndicator" style="font-family: \'Segoe UI MDL Symbol\'" ng-show="vxColSettings.reverse == false && vxColSettings.predicate == header.id"></span><span class="sortIndicator" style="font-family: \'Segoe UI MDL Symbol\'" ng-show="vxColSettings.reverse == true && vxColSettings.predicate == header.id"></span>Sort'+
        '                                        </li>'+
        '                                        <li tabindex="0" role="presentation" class="filterClear" ng-if="vxColSettings.dropdDownLoaded[header.id] == true && vxColSettings.dropDownFilters[header.id] == true && vxColSettings.colFilterPairs[header.id].length > 0" ng-class="{ \'disabled\': vxColSettings.colFiltersActivated[header.id] == false}" ng-click="filterClearClick(header)">'+
        '                                            <span class="segoe-ui-symbol indicator"></span>Clear All Filters'+
        '                                        </li>'+
        '                                        <li role="presentation" class="filter" ng-if="vxColSettings.dropdDownLoaded[header.id] == true && vxColSettings.dropDownFilters[header.id] == true && filter.disabled == false" ng-repeat="filter in vxColSettings.colFilterPairs[header.id]">'+
        '                                            <input class="filter-toggle" type="checkbox" ng-model="vxColSettings.colFiltersStatus[filter.key]" ng-change="filterClick(header, filter)" /><label class="filterItemTitle">{{filter.name}}</label>'+
        '                                        </li>'+
        '                                    </ul>'+
        '                                </div>'+
        '                                <div ng-if="header.renderDefn == true" vx-compile="header.headerDefn"></div>'+
        '                            </th>'+
        '                            <th class="vxHeadRowCell" ng-if="vxColSettings.xsViewEnabled == true">'+
        '                                <div class="search-container pull-left input-group">'+
        '                                    <div class="searchSymb icon-container"><i class="icon icon-search"></i></div>'+
        '                                    <input class="search form-control" type="search" ng-model="vxColSettings.xsSearch" placeholder="Search" />'+
        '                                </div>'+
        '                                <div class="icon-container pull-right" role="button" tabindex="{{vxColSettings.xsSearch == \'\' ? -1 : 0}}" ng-class="{ \'disabled\' : vxColSettings.xsSearch == \'\'}" vx-key="xsReset()">'+
        '                                    <i class="icon icon-refresh"></i>'+
        '                                </div>'+
        '                                <div class="icon-container pull-right hidden-xs" role="button" tabindex="0" ng-class="{\'active\' : vxColSettings.menu }" vx-key="openManageColumns()">'+
        '                                    <i class="icon icon-repair"></i>'+
        '                                </div>'+
        '                                <div class="icon-container pull-right" role="button" tabindex="{{vxColSettings.multiSelected.length == 0 ? -1 : 0 }}" ng-class="{ \'disabled\' : vxColSettings.multiSelected.length == 0}" vx-key="clearSelection()" ng-if="vxConfig.selectionEnabled">'+
        '                                    <i class="icon icon-clearselection"></i>'+
        '                                </div>'+
        '                                <div class="icon-container pull-right" role="button" tabindex="{{vxColSettings.selectAllEnabled == false && vxConfig.multiSelectionEnabled == true ? -1 : 0}}" ng-class="{ \'disabled\' :vxColSettings.selectAllEnabled == false && vxConfig.multiSelectionEnabled == true}" vx-key="selectAllFiltered()" ng-if="vxConfig.selectionEnabled">'+
        '                                    <i class="icon icon-openwith"></i>'+
        '                                </div>'+
        '                            </th>'+
        '                        </tr>'+
        '                    </thead>'+
        '                    <tbody class="vxBody" vs-repeat vs-options="{latch: true}" vs-scroll-parent="{{scrollParent}}" vs-excess="{{vxColSettings.latchExcess}}" ng-class="{ \'revealWrap\' : vxColSettings.revealWrapRowData }">'+
        '                        <tr class="{{vxColSettings.vxRowClass[row[vxColSettings.primaryId]]}} vxBodyRow" ng-repeat="row in ( vxConfig.vxFilteredData = (vxConfig.data | filter:vxColSettings.xsSearch | vxGridMultiBoxFilters: multiBoxFilters | orderBy:vxColSettings.predicate:vxColSettings.reverse))" ng-class="{ \'vxRowSelected\' : vxColSettings.rowSelected[row[vxColSettings.primaryId]]}">'+
        '                            <td class="vxBodyRowCell" ng-repeat="header in vxConfig.columnDefConfigs" ng-style="{ \'width\' : header.width + \'px\' }" ng-if="header.hidden == false && row.type != \'groupRow\' && vxColSettings.xsViewEnabled == false">'+
        '                                <span ng-if="header.renderDefn == false">{{row[header.id]}}</span>'+
        '                                <div ng-if="header.renderDefn == true" vx-compile-clone-link="header.cellDefn"></div>'+
        '                            </td>'+
        '                            <td class="vxBodyRowCell groupCell" ng-if="row.type == \'groupRow\' && vxColSettings.xsViewEnabled == false" colspan="1">'+
        '                                <div vx-compile="row.cellDefn"></div>'+
        '                            </td>'+
        '                            <td class="vxBodyRowCell groupCell" ng-if="row.type == \'groupRow\' && vxColSettings.xsViewEnabled == false" colspan="{{getVisibleHeaderCounts() - 1}}">'+
        '                                <span class="first">GROUPED BY {{row.colName}} : </span><span class="colname">{{row.value}}</span>'+
        '                            </td>'+
        '                            <td class="vxBodyRowCell xsCell" ng-if="vxColSettings.xsViewEnabled == true" ng-class="{ \'rowSelectionEnabled\': vxConfig.selectionEnabled == true }">'+
        '                                <div class="xsSelectionHolder" vx-compile-clone-link="vxConfig.columnDefConfigs[0].cellDefn" ng-if="vxConfig.selectionEnabled"></div>'+
        '                                <div class="xsRowTitleHolder" ng-click="row.xsViewDetails = !row.xsViewDetails">'+
        '                                    <span ng-if="vxColSettings.xsRowTitleTemplateAvailable == false">{{row[vxColSettings.primaryId]}}</span>'+
        '                                    <div ng-if="vxColSettings.xsRowTitleTemplateAvailable == true" vx-compile="vxConfig.xsRowTitleTemplate"></div>'+
        '                                </div>'+
        '                                <div class="xsRowViewToggleHolder" ng-click="row.xsViewDetails = !row.xsViewDetails">'+
        '                                    <div class="icon-container">'+
        '                                        <i class="icon icon-ScrollChevronUpLegacy" ng-show="row.xsViewDetails"></i>'+
        '                                        <i class="icon icon-ScrollChevronDownLegacy" ng-show="!row.xsViewDetails"></i>'+
        '                                    </div>'+
        '                                </div>'+
        '                                <div class="col-xs-12 xsCellContentHolder" collapse="!row.xsViewDetails">'+
        '                                    <div class="xsCellContent" ng-repeat="header in vxConfig.columnDefConfigs" ng-if="$index > 0 && header.xsHidden == false && row.type != \'groupRow\'">'+
        '                                        <div class="col-xs-12 xsCellHeader">{{header.columnName}}</div>'+
        '                                        <div class="col-xs-12 xsCellValue">'+
        '                                            <span ng-if="header.renderDefn == false">{{row[header.id]}}</span>'+
        '                                            <div ng-if="header.renderDefn == true" vx-compile-clone-link="header.cellDefn"></div>'+
        '                                        </div>'+
        '                                        <div class="clearfix"></div>'+
        '                                    </div>'+
        '                                </div>'+
        '                            </td>'+
        '                        </tr>'+
        '                    </tbody>'+
        '                </table>'+
        '            </div>'+
        '        </div>'+
        '    </div>'+
        '    <div class="icon-container scrollAction" role="button" tabindex="0" vx-key="justScrollTop()">'+
        '        <i class="icon icon-up"></i>'+
        '    </div>'+
        '</div>'
            );
    }])
})();