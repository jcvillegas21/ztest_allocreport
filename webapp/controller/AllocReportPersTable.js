sap.ui.define(['sap/ui/thirdparty/jquery'],
	function(jQuery) {
	"use strict";

	// Very simple page-context personalization
	// persistence service, not for productive use!
        return {
        /** 
         * Creates personalization columns from table
         * @param {Object} oTable - Table
         * @returns {Array} - array of columns to be personalized
         */
        getPersoTableColumns: function (oTable) {
            
            return oTable.getColumns().map(function (oColumn, index) {
                return {
                    "order": index,
                    "visible": oColumn.getVisible(),
                    "id": oColumn.getId(),
                    "fieldName": oColumn.mAggregations.label.mProperties.text
                };
            });
        },

        generatePersonalisationService: function (oTable, oController) { debugger;
            let aColumns = this.getPersoTableColumns(oTable);
            let oData = {
                _persoSchemaVersion: "1.0",
                aColumns: aColumns
            };
            return {
                getPersData : function () { debugger;
                    var oDeferred = new jQuery.Deferred();
                    if (!this._oBundle) {
                        this._oBundle = oData;
                    }
                    oDeferred.resolve(this._oBundle);
                    return oDeferred.promise();
                },
        
                setPersData : function (oBundle) { debugger;
                    var oDeferred = new jQuery.Deferred();
                    this._oBundle = oBundle;
                    oDeferred.resolve();
                    return oDeferred.promise();
                },
        
                getResetPersData : function () {
                    var oDeferred = new jQuery.Deferred();
        
                    setTimeout(function() {
                        oDeferred.resolve(this.oResetData);
                    }.bind(this), 2000);
        
                    return oDeferred.promise();
                },

                delPersData : function () {
                    var oDeferred = new jQuery.Deferred();
                    this._oBundle = oData;
                    oDeferred.resolve();
                    return oDeferred.promise();
                },
        
                resetPersData : function () {
                    var oDeferred = new jQuery.Deferred();
        
                    //set personalization
                    this._oBundle = oData;
        
                    //reset personalization, i.e. display table as defined
                    //this._oBundle = null;
        
                    oDeferred.resolve();
        
                    return oDeferred.promise();
                }
            };
        }
        //  getPersoTableColumns: function (oTable) {
        //     if (!oTable) { return []; }
        //     return oTable.getColumns().map(function (oColumn, index) {
        //         return {
        //             "order": index,
        //             "visible": oColumn.getVisible(),
        //             "id": oColumn.getId()
        //         };
        //     });
        // },
        // generatePersonalisationService: function (oTable, oController) {
        //     // Store the initial, default layout of the table when the app starts.
        //     const oInitialData = {
        //         _persoSchemaVersion: "1.0",
        //         aColumns: this.getPersoTableColumns(oTable)
        //     };

        //     return {
        //         _oBundle: null, // This will hold the current personalization state.

        //         getPersData : function () {
        //             var oDeferred = new jQuery.Deferred();
        //             // If no personalization has been applied yet, return the initial default state.
        //             if (!this._oBundle) {
        //                 this._oBundle = jQuery.extend(true, {}, oInitialData);
        //             }
        //             oDeferred.resolve(this._oBundle);
        //             return oDeferred.promise();
        //         },
        
        //         setPersData : function (oBundle) {
        //             var oDeferred = new jQuery.Deferred();
        //             this._oBundle = oBundle; // Store the new personalization from the variant or dialog.
        //             if (oController && typeof oController.onPersoDone === "function") {
        //                 oController.onPersoDone();
        //             }
        //             oDeferred.resolve();
        //             return oDeferred.promise();
        //         },
        
        //         delPersData : function () {
        //             var oDeferred = new jQuery.Deferred();
        //             this._oBundle = jQuery.extend(true, {}, oInitialData); // Reset to the initial state.
        //             oDeferred.resolve();
        //             return oDeferred.promise();
        //         },
        
        //         resetPersData : function () {
        //             var oDeferred = new jQuery.Deferred();
        //             // **FIX**: Explicitly set the current bundle back to the initial default state.
        //             this._oBundle = jQuery.extend(true, {}, oInitialData);
        //             oDeferred.resolve();
        //             return oDeferred.promise();
        //         }
        //     };
        // }
        };
    
    });