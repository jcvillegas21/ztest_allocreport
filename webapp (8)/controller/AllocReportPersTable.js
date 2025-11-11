
sap.ui.define(['sap/ui/thirdparty/jquery'],
    function (jQuery) {
        "use strict";

        return {
            /**
             * Captures the current state of the table's columns.
             * @param {sap.ui.table.Table} oTable The table control.
             * @returns {Array} An array representing the column layout.
             */
            getPersoTableColumns: function (oTable) {
                if (!oTable) { return []; }
                return oTable.getColumns().map(function (oColumn, index) {
                    return {
                        "order": index,
                        "visible": oColumn.getVisible(),
                        "id": oColumn.getId(),
                        "fieldName": oColumn.mAggregations.label.mProperties.text
                    };
                });
            },

            /**
             * Generates the personalization service for a table.
             * @param {sap.ui.table.Table} oTable The table control.
             * @param {sap.ui.core.mvc.Controller} oController The view's controller.
             * @returns {object} The personalization service object.
             */
            generatePersonalisationService: function (oTable, oController) {
                // Store the initial, default layout of the table when the app starts.
                const oInitialData = {
                    _persoSchemaVersion: "1.0",
                    aColumns: this.getPersoTableColumns(oTable)
                };

                return {
                    _oBundle: null, // This will hold the current personalization state.

                    getPersData : function () {
                        var oDeferred = new jQuery.Deferred();
                        if (!this._oBundle) {
                            this._oBundle = jQuery.extend(true, {}, oInitialData);
                        }
                        oDeferred.resolve(this._oBundle);
                        return oDeferred.promise();
                    },

                    setPersData : function (oBundle) {
                        var oDeferred = new jQuery.Deferred();
                        this._oBundle = oBundle;
                        oDeferred.resolve();
                        return oDeferred.promise();
                    },
                     delPersData: function () {
                        var oDeferred = new jQuery.Deferred();
                        // Deleting personalization should reset it to the initial state.
                        this._oBundle = jQuery.extend(true, {}, oInitialData);
                        oDeferred.resolve();
                        return oDeferred.promise();
                    },

                    resetPersData : function () {
                        var oDeferred = new jQuery.Deferred();
                        this._oBundle = jQuery.extend(true, {}, oInitialData);
                        oDeferred.resolve();
                        return oDeferred.promise();
                    }
                };
            }
        };
    });