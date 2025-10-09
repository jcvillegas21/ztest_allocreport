sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "com/pg/s4/zaatpallocrpt/fiorizaatpallocrpt/model/formatter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "sap/m/Token",
    "sap/ui/model/Sorter", 
    "sap/ui/export/library",   
    "sap/ui/export/Spreadsheet",
    "sap/m/MessageToast",
    "com/pg/s4/zaatpallocrpt/fiorizaatpallocrpt/controller/CustomVariant",
    "sap/ui/comp/smartvariants/PersonalizableInfo",
    "com/pg/s4/zaatpallocrpt/fiorizaatpallocrpt/controller/AllocReportPersTable",
     "sap/ui/table/TablePersoController"
    
], (Controller, formatter, Filter, FilterOperator, JSONModel, Fragment, Token, Sorter, exportLibrary, Spreadsheet, MessageToast, customVariant, PersonalizableInfo, AllocReportPersTable,TablePersoController ) => {
    "use strict";

    var EdmType = exportLibrary.EdmType;
    return Controller.extend("com.pg.s4.zaatpallocrpt.fiorizaatpallocrpt.controller.AllocReportingMain", {
         // Make the formatter available to the view by creating a property in the controller
		formatter: formatter,

        /**
         * Called when the controller is instantiated.
         * Sets up a view model to control filter visibility.
         */
        onInit: function() {
             this.getView().setModel(new JSONModel({ isOrderBasedTab: false }), "viewModel");

            this.getView().setModel(new JSONModel({
                characteristicsData: { include: {}, exclude: {} },
                timeBucketType: null, allocSeq: null, eventReason: null, allocUom: null,
                eventValidity: { from: null, to: null }, cvcTimeBucket: { from: null, to: null }
            }), "filterModel");


            this._oPersoServiceEvent = AllocReportPersTable.generatePersonalisationService(this.byId("AllocReporteventBasedTable"), this);
            this._oPersoServiceOrder = AllocReportPersTable.generatePersonalisationService(this.byId("AllocReportorderBasedTable"), this);

            this._oTPCEvent = new TablePersoController({ table: this.byId("AllocReporteventBasedTable"), persoService: this._oPersoServiceEvent });
            this._oTPCOrder = new TablePersoController({ table: this.byId("AllocReportorderBasedTable"), persoService: this._oPersoServiceOrder });
               


        },
        
        onAfterRendering : function(){

             // Instantiate your custom variant control
            this._customVariant = new customVariant(this.createId("customVariant"), {
                persistencyKey: "commanKey"
            });
            
            // Link the SmartVariantManagement control to your custom control
            var oPersInfoFilter = new PersonalizableInfo({
                keyName: "persistencyKey",
                type: "filterBar",
                control: this._customVariant
            });

            
            
          
            this._oSmartVariantManagement = this.byId("AllocReportid_allocrpt_svm");

            this._oSmartVariantManagement.addPersonalizableControl(oPersInfoFilter);
            // this._oSmartVariantManagement.addPersonalizableControl(oPersInfoEvent);
            // this._oSmartVariantManagement.addPersonalizableControl(oPersInfoOrder);
            
            // Register the callbacks for fetching and applying variant data (table Perso will be handled by TPC automatically)
            this._customVariant.registerFetchData(this.onVariantFetchData.bind(this));
            this._customVariant.registerApplyData(this.onVariantApplyData.bind(this));

            // Initialize the SmartVariantManagement control
            this._oSmartVariantManagement.initialise(() => {
                this._oSmartVariantManagement.currentVariantSetModified(false);
            }, this._customVariant);
        },
        
        /**
         * Gathers the current state of filters and table layouts to be saved in a variant.
         * @returns {object} A JSON object representing the complete variant state.
         */
        onVariantFetchData: function () {

                // const aColumnsData = [];
				// this.getView().byId("AllocReporteventBasedTable")._getVisibleColumns().forEach((oColumn, index) => {
				// 	const aColumn = {};
				// 	aColumn.fieldName = oColumn.getProperty('name');
				// 	aColumn.Id = oColumn.getId();
				// 	aColumn.index = index;
                //     aColumn.width = oColumn.getWidth();
				// 	aColumn.Visible = oColumn.getVisible();
				// 	aColumn.filterProperty = oColumn.getProperty('filterProperty');
				// 	aColumn.sortProperty = oColumn.getProperty('sortProperty');
                //     aColumn.sorted = oColumn.getProperty('sorted');
                //     aColumn.sortOrder = oColumn.getProperty('sortOrder');
				// 	aColumn.defaultFilterOperator = oColumn.getProperty('defaultFilterOperator');
				// 	aColumnsData.push(aColumn);
				// });


            const oState = {
                // filters: this.getView().getModel("filterModel").getData(),
                // eventTablePerso: { aColumns: AllocReportPersTable.getPersoTableColumns(this.byId("AllocReporteventBasedTable")) },
                // orderTablePerso: { aColumns: AllocReportPersTable.getPersoTableColumns(this.byId("AllocReportorderBasedTable")) }
                 filters: this.getView().getModel("filterModel").getData(),
                    eventTablePerso: this._oPersoServiceEvent._oBundle || 
                        { _persoSchemaVersion: "1.0", aColumns: AllocReportPersTable.getPersoTableColumns(this.byId("AllocReporteventBasedTable")) },
                    orderTablePerso: this._oPersoServiceOrder._oBundle || 
                        { _persoSchemaVersion: "1.0", aColumns: AllocReportPersTable.getPersoTableColumns(this.byId("AllocReportorderBasedTable")) }
            };
            return oState;
           
 
        },
         /**
         * Applies a saved variant state to all filters and tables.
         * @param {object} oState - The JSON object containing the saved variant state.
         */
        onVariantApplyData: function (oState) { debugger

            const isEmpty = (obj) => {return Object.keys(obj).length === 0;};
           
            var bIsStandard = !(isEmpty(oState.filters.characteristicsData.include)||isEmpty(oState.filters.characteristicsData.exclude));
          
            if (bIsStandard) {
                this._clearAllFilters();
                this._oPersoServiceEvent.resetPersData().done(() => this._oTPCEvent.refresh());
                this._oPersoServiceOrder.resetPersData().done(() => this._oTPCOrder.refresh());
                return;
            }
          
            if (!(isEmpty(oState.filters.characteristicsData.include))||!(isEmpty(oState.filters.characteristicsData.exclude))) {
                var oFilterState = JSON.parse(JSON.stringify(oState.filters));
                oFilterState.eventValidity.from = oFilterState.eventValidity.from ? new Date(oFilterState.eventValidity.from) : null;
                oFilterState.eventValidity.to = oFilterState.eventValidity.to ? new Date(oFilterState.eventValidity.to) : null;
                oFilterState.cvcTimeBucket.from = oFilterState.cvcTimeBucket.from ? new Date(oFilterState.cvcTimeBucket.from) : null;
                oFilterState.cvcTimeBucket.to = oFilterState.cvcTimeBucket.to ? new Date(oFilterState.cvcTimeBucket.to) : null;
                
                this.getView().getModel("filterModel").setData(oFilterState);
                this._updateCharacteristicsTokens();
            }

            this.onSearch();

           if (oState.eventTablePerso) {
             this.setVariantPersOnTable(oState.eventTablePerso, 'eventBasedTable');
                // this.f.setPersData(oState.eventTablePerso).done(() => {
                    // this._oTPCEvent.refresh();
               // });
            }
            if (oState.orderTablePerso) {
                // this._oPersoServiceOrder.setPersData(oState.orderTablePerso).done(() => {
                    // this._oTPCOrder.refresh();
                // });
                this.setVariantPersOnTable(oState.orderTablePerso, 'orderBasedTable');
            }

       
        },
        onFilterChanged: function () {debugger;
            this.handleVariantModification(true);
        },

        setVariantPersOnTable:function(tableColData, tableId)
        {
               const aColumns = tableColData;
					// Hide all columns first
					this.getView().byId(tableId).getColumns().forEach((oColumn) => {
						oColumn.setVisible(false);
					});
					// re-arrange columns according to the saved variant
					aColumns.aColumns.forEach((aColumn) => {
						const aTableColumn = $.grep(this.getView().byId(tableId).getColumns(), (colObj, id) => colObj.sId=== aColumn.id);
						if (aTableColumn.length > 0) {
							aTableColumn[0].setVisible(aColumn.visible);
                           // aTableColumn[0].setWidth(aColumn.width);
							//aTableColumn[0].setFilterProperty(aColumn.filterProperty);
							//aTableColumn[0].setSortProperty(aColumn.sortProperty);
							//aTableColumn[0].setDefaultFilterOperator(aColumn.defaultFilterOperator);
							//aTableColumn[0].setSorted(aColumn.sorted);
							//aTableColumn[0].setSortOrder(aColumn.sortOrder);
							this.getView().byId(tableId).removeColumn(aTableColumn[0]);
							this.getView().byId(tableId).insertColumn(aTableColumn[0], aColumn.order);
						}
					});
        },
           
        /**
         * Notifies the Variant Management that a change has occurred.
         */
        handleVariantModification: function (bIsModified) { debugger;
             if (this._oSmartVariantManagement) {
                this._oSmartVariantManagement.currentVariantSetModified(bIsModified);
            }
        },

        onPersonalizeColumns: function () {
            var bIsOrderBasedTab = this.getView().getModel("viewModel").getProperty("/isOrderBasedTab");
            var oTPC = bIsOrderBasedTab ? this._oTPCOrder : this._oTPCEvent;
            
            oTPC.openDialog();
            if (oTPC._oDialog) { debugger;
              oTPC._oDialog.detachConfirm(this._onUITblColumnPersoDonePressed, this);
                oTPC._oDialog.attachConfirm(this._onUITblColumnPersoDonePressed, this);
           
            }
           
              

        },
        // onPersoDone: function() {
        //     this.handleVariantModification(true);
        // },
        _onUITblColumnPersoDonePressed: function () {
              // This function is now correctly called when the user clicks "OK" in the personalization dialog.
            this.handleVariantModification(true);
        },

        //global search logic
        onGlobalSearch: function(oEvent) { debugger;
            var sQuery = oEvent.getParameter("newValue");
                var oViewModel = this.getView().getModel("viewModel");
                var bIsOrderBased = oViewModel.getProperty("/isOrderBasedTab");
                var oTable = bIsOrderBased ? this.byId("AllocReportorderBasedTable") : this.byId("AllocReporteventBasedTable");
                var oBinding = oTable.getBinding("rows");
                
                // if (oBinding) {
                //     var aFilters = [];

                //     if (sQuery && sQuery.length > 0) {
                //         var aSearchFields = ["Vkorg", "Vtweg", "Matnr", "Market", "Ean", "Kunnr", "Zzcustgrp",
                //                              "TimeBucketType", "Pap",  "EventId" ];

                //          // Create an array of individual filters for each field
                //         var aIndividualFilters = aSearchFields.map(function(sField) {
                //             return new sap.ui.model.Filter(sField, sap.ui.model.FilterOperator.Contains, sQuery);
                //         });

                //         // Combine individual filters with an OR operator
                //         aFilters.push(new sap.ui.model.Filter({
                //             filters: aIndividualFilters,
                //             and: false // Use OR for combining search fields
                //         }));

                //     }
                //     oBinding.filter(aFilters);

                // }
                var oModel = bIsOrderBased ? this.getView().getModel("orderModel") : this.getView().getModel("eventModel"); // Your main OData Model
                var oMetaModel = oModel.getMetaModel();

                if (!sQuery) { // If search is cleared
                    oBinding.filter([]);
                    return;
                }

                // Wait for metadata to be loaded before proceeding
                oMetaModel.loaded().then(function () {
                    var aFilters = [];
                    var aIndividualFilters = [];
                    var aSearchFields = ["Vkorg", "Vtweg", "Matnr", "Market", "Ean", "Kunnr", "Zzcustgrp", "TimeBucketType", "Pap", "EventId", "Meins"]; // Your list of fields

                    // IMPORTANT: Get the correct EntityType name from your $metadata file
                    var sEntityTypeName = "AllocReportEventType"; // Replace with your actual EntityType name
                    var oEntityType = oMetaModel.getODataEntityType(oModel.getServiceMetadata().dataServices.schema[0].namespace + "." + sEntityTypeName);

                    aSearchFields.forEach(function (sField) {
                        var oProperty = oMetaModel.getODataProperty(oEntityType, sField);

                        // ONLY add a filter for this field if:
                        // 1. The property metadata exists, AND
                        // 2. The property has no maxLength OR the query length is not greater than the maxLength.
                        if (oProperty && (!oProperty.maxLength || sQuery.length <= oProperty.maxLength)) {
                            aIndividualFilters.push(new sap.ui.model.Filter({
                                path: sField,
                                operator: sap.ui.model.FilterOperator.Contains,
                                value1: sQuery
                            }));
                        }
                    });

                    if (aIndividualFilters.length > 0) {
                        aFilters.push(new sap.ui.model.Filter({
                            filters: aIndividualFilters,
                            and: false
                        }));
        }

        oBinding.filter(aFilters);
    }.bind(this));

        },
       

        onSearch: function (oEvent) {
            var oViewModel = this.getView().getModel("viewModel");
            var bIsOrderBasedTab = oViewModel.getProperty("/isOrderBasedTab");
            var oTable = bIsOrderBasedTab ? this.byId("AllocReportorderBasedTable") : this.byId("AllocReporteventBasedTable");
            
            oTable.setBusy(true);
            // this.loadTableData(oTable, bIsOrderBasedTab).then(() => {
            //     oTable.setBusy(false);
            // }).catch((oError) => {
            //     oTable.setBusy(false);
            //     MessageToast.error("An error occurred: " + oError.message);
            // });

            //calls event table data
            this.loadTableData(this.byId("AllocReporteventBasedTable"), false).finally(() => oTable.setBusy(false));

            //make another with true to get order table data
            this.loadTableData(this.byId("AllocReportorderBasedTable") , true).finally(() => oTable.setBusy(false));
        
        },

        loadTableData: function (oTable, bIsOrderBasedTab) {
          
                return new Promise((resolve) => {
                var aFinalFilters = [];
                var oFilterData = this.getView().getModel("filterModel").getData();
                var oCharacteristics = oFilterData.characteristicsData;

                // --- Build from Characteristics Dialog ---
                var aIncludeFilters = [];
                Object.keys(oCharacteristics.include).forEach(sField => {
                    const aValues = oCharacteristics.include[sField];
                    if (aValues && aValues.length > 0) {
                        const aFieldFilters = aValues.map(sValue => new Filter(sField, FilterOperator.EQ, sValue));
                        aIncludeFilters.push(new Filter({ filters: aFieldFilters, and: false }));
                    }
                });
                if (aIncludeFilters.length > 0) {
                    aFinalFilters.push(new Filter({ filters: aIncludeFilters, and: true }));
                }
                var aExcludeFilters = [];
                Object.keys(oCharacteristics.exclude).forEach(sField => {
                    const aValues = oCharacteristics.exclude[sField];
                    if (aValues && aValues.length > 0) {
                        const aFieldFilters = aValues.map(sValue => new Filter(sField, FilterOperator.NE, sValue));
                        aExcludeFilters.push(new Filter({ filters: aFieldFilters, and: false }));
                    }
                });
                if (aExcludeFilters.length > 0) {
                    aFinalFilters.push(new Filter({ filters: aExcludeFilters, and: true }));
                }

                // --- 2. Build filters from single FilterBar fields ---
                var aSimpleFilters = [];

             
                
                // For Time Bucket Type, filter by its TEXT value
                if (!bIsOrderBasedTab && oFilterData.timeBucketType) {
                    aSimpleFilters.push(new Filter("TimeBucketType", FilterOperator.EQ, oFilterData.timeBucketType));
                }
                if (oFilterData.allocSeq) {
                    aSimpleFilters.push(new Filter("Pap", FilterOperator.EQ, oFilterData.allocSeq));
                }
                // For Event Reason, filter by its TEXT value
                if (oFilterData.eventReason) {
                    aSimpleFilters.push(new Filter("EventId", FilterOperator.EQ, oFilterData.eventReason));
                }
                if (oFilterData.allocUom) {
                    aSimpleFilters.push(new Filter("Meins", FilterOperator.EQ, oFilterData.allocUom));
                }
                if (oFilterData.eventValidity && oFilterData.eventValidity.from && oFilterData.eventValidity.to) {
                     const oStartDateFilter = new Filter("StartDate", FilterOperator.GE, oFilterData.eventValidity.from);
                     const oEndDateFilter = new Filter("EndDate", FilterOperator.LE, oFilterData.eventValidity.to);
                     aSimpleFilters.push(new Filter({ filters: [oStartDateFilter, oEndDateFilter], and: true }));
                }
                if (oFilterData.cvcTimeBucket && oFilterData.cvcTimeBucket.from && oFilterData.cvcTimeBucket.to) {
                    aSimpleFilters.push(new Filter("TimeBucketPeriod", FilterOperator.BT, oFilterData.cvcTimeBucket.from, oFilterData.cvcTimeBucket.to));
                }

                if (aSimpleFilters.length > 0) {
                    aFinalFilters.push(new Filter({ filters: aSimpleFilters, and: true }));
                }
                if (aSimpleFilters.length > 0) {
                    aFinalFilters.push(new Filter({ filters: aSimpleFilters, and: true }));
                }

                // --- 3. Apply all filters ---
                oTable.getBinding("rows").filter(aFinalFilters.length > 0 ? new Filter({ filters: aFinalFilters, and: true }) : []);
                setTimeout(() => resolve(), 200);
            });
        },


        /**
         * Handles the 'select' event of the IconTabBar.
         * When a tab is selected, it updates the view model to show/hide the correct filters.
         * @param {sap.ui.base.Event} oEvent The event object
         */
        onTabSelect: function(oEvent) {
            var sSelectedKey = oEvent.getParameter("key");
            this.getView().getModel("viewModel").setProperty("/isOrderBasedTab", sSelectedKey === "Order");
            
            // Clear all filters on tab switch
          //  this._clearAllFilters();
        },
         /**
         * Handles the 'clear' event of the FilterBar.
         */
        onClear: function() {
            this._clearAllFilters();
        },

        /**
         * Private helper method to clear all filter controls.
         */
        _clearAllFilters: function() {
 
  
            var oInitialFilterData = {
                characteristicsData: { include: {}, exclude: {} },
                timeBucketType: null, // Set to null for ComboBox value
                allocSeq: null, 
                eventReason: null, // Set to null for ComboBox value
                allocUom: null,
                eventValidity: { from: null, to: null }, 
                cvcTimeBucket: { from: null, to: null }
            };
            this.getView().getModel("filterModel").setData(oInitialFilterData);
            this._updateCharacteristicsTokens();
            this.onFilterChanged();
         //  this.handleVariantModification(true);
        },

        //Clear fragment
        onClearPress: function() {
 
        let oFormToClear;
        // Get reference to the IconTabBar
        const oIconTabBar = this.byId("AllocReportcharIncludeExcludeTabs"); 
        // Get the currently selected tab's key
        const sSelectedKey = oIconTabBar.getSelectedKey();
        const oViewModel = this.getView().getModel("viewModel");
     //   const oViewModel = this.getModel("viewModel");
        const isOrderBased = oViewModel.getProperty("/isOrderBasedTab");
        
        // Case 1: "Include" tab is selected
        if (sSelectedKey === "include") {
            if (oViewModel.getProperty("/isOrderBasedTab")) {
             oFormToClear = this.byId("AllocReportorderBasedIncludeForm");
            }  else {
                 oFormToClear = this.byId("AllocReporteventBasedIncludeForm");
            }
        } 
         // Case 2: "Exclude" tab is selected
        else if (sSelectedKey === "exclude") {
            if(isOrderBased) {
                oFormToClear = this.byId("AllocReportorderBasedExcludeForm");
            } else {
                 oFormToClear = this.byId("AllocReporteventBasedExcludeForm");
            }
             
        }

        // Proceed to clear the form's content if a form was found
        if (oFormToClear) {
            oFormToClear.getContent().forEach(oControl => {
                if (oControl instanceof sap.m.MultiInput) {
                    oControl.removeAllTokens();
                }
            });
          }
        },

          // --- CHARACTERISTICS DIALOG ---

        onCharacteristicsValueHelp: function(oEvent) {
            if (!this._oCharDialog) {
                Fragment.load({
                    id: this.getView().getId(),
                    name: "com.pg.s4.zaatpallocrpt.fiorizaatpallocrpt.fragment.CharSelection",
                    controller: this
                }).then(function (oDialog) {
                    this._oCharDialog = oDialog;
                    this.getView().addDependent(this._oCharDialog);
                    // *** NEW: Attach validators after the dialog is created ***
                    this._attachMultiInputValidators();
                    this._oCharDialog.open();
                }.bind(this));
            } else {
                this._oCharDialog.open();
            }
        },
         /**
         * @private
         * Attaches a validator function to all MultiInput controls within the fragment.
         * This validator handles the creation of tokens from free text.
         */
        _attachMultiInputValidators: function() {
            const aMultiInputIds = [
                // Include - Event
                "AllocReportincludeEventVkorgInput", "AllocReportincludeEventVtwegInput", "AllocReportincludeEventMarketInput", "AllocReportincludeEventMatnrInput", "AllocReportincludeEventEANInput", "AllocReportincludeEventCustHierarchyInput", "AllocReportincludeEventCustGroupInput", 
                // Include - Order
                "AllocReportincludeOrderVkorgInput", "AllocReportincludeOrderVtwegInput", "AllocReportincludeOrderMarketInput", "AllocReportincludeOrderMatnrInput", "AllocReportincludeOrderEANInput", "AllocReportincludeOrderCustHierarchyInput", "AllocReportincludeOrderCustGroupInput",
                // Exclude - Event
                "AllocReportexcludeEventVkorgInput", "AllocReportexcludeEventVtwegInput", "AllocReportexcludeEventMarketInput", "AllocReportexcludeEventMatnrInput", "AllocReportexcludeEventEANInput", "AllocReportexcludeEventCustHierarchyInput", "AllocReportexcludeEventCustGroupInput",
                // Exclude - Order
                "AllocReportexcludeOrderVkorgInput", "AllocReportexcludeOrderVtwegInput", "AllocReportexcludeOrderMarketInput", "AllocReportexcludeOrderMatnrInput", "AllocReportexcludeOrderEANInput", "AllocReportexcludeOrderCustHierarchyInput", "AllocReportexcludeOrderCustGroupInput"
            ];
            
            aMultiInputIds.forEach(sId => {
                const oMultiInput = this.byId(sId);
                if (oMultiInput) {
                    // Remove any old validators to prevent duplicates if this code is run more than once
                    oMultiInput.removeAllValidators();
                    
                    // Add the validator function
                    oMultiInput.addValidator((oArgs) => {
                        // Create a new token from the user's text
                        return new Token({ key: oArgs.text, text: oArgs.text });
                    });
                }
            });
        },
       /**
         * Gathers data from the Characteristics Selection dialog when the user clicks "OK".
         * It reads all tokenized values from the visible MultiInput controls, updates the central
         * filter model, and then updates the summary tokens on the main filter bar.
         */
        onCharacteristicsDialogOk: function() { debugger;
            var oCharData = { include: {}, exclude: {} }; // Temporary storage for the dialog's data
            var bIsOrderBasedTab = this.getView().getModel("viewModel").getProperty("/isOrderBasedTab");
            var oView = this.getView();

            // Define which controls to read based on the active tab
            var aIncludeControls = bIsOrderBasedTab ? 
                [oView.byId("AllocReportincludeOrderVkorgInput"), oView.byId("AllocReportincludeOrderVtwegInput"), oView.byId("AllocReportincludeOrderMarketInput"), oView.byId("AllocReportincludeOrderMatnrInput"), oView.byId("AllocReportincludeOrderEANInput"), oView.byId("AllocReportincludeOrderCustHierarchyInput"), oView.byId("AllocReportincludeOrderCustGroupInput")] : 
                [oView.byId("AllocReportincludeEventVkorgInput"), oView.byId("AllocReportincludeEventVtwegInput"), oView.byId("AllocReportincludeEventMarketInput"), oView.byId("AllocReportincludeEventMatnrInput"), oView.byId("AllocReportincludeEventEANInput"), oView.byId("AllocReportincludeEventCustHierarchyInput"), oView.byId("AllocReportincludeEventCustGroupInput")];
            
            var aExcludeControls = bIsOrderBasedTab ?
                [oView.byId("AllocReportexcludeOrderVkorgInput"), oView.byId("AllocReportexcludeOrderVtwegInput"), oView.byId("AllocReportexcludeOrderMarketInput"), oView.byId("AllocReportexcludeOrderMatnrInput"), oView.byId("AllocReportexcludeOrderEANInput"), oView.byId("AllocReportexcludeOrderCustHierarchyInput"), oView.byId("AllocReportexcludeOrderCustGroupInput")] : // Note: A typo "ex2cludeOrderCustGroupInput" was corrected here
                [oView.byId("AllocReportexcludeEventVkorgInput"), oView.byId("AllocReportexcludeEventVtwegInput"), oView.byId("AllocReportexcludeEventMarketInput"), oView.byId("AllocReportexcludeEventMatnrInput"), oView.byId("AllocReportexcludeEventEANInput"), oView.byId("AllocReportexcludeEventCustHierarchyInput"), oView.byId("AllocReportexcludeEventCustGroupInput")];
            
            // Helper function to process the controls and extract their data
            var fnProcessControls = function(aControls, oStorage) {
                aControls.forEach(function(oControl) {
                    if (!oControl) { return; } // Safety check if a control is not found
                    
                    var sFieldName = "";
                    var aCustomData = oControl.getCustomData();
                    for (var i = 0; i < aCustomData.length; i++) {
                        if (aCustomData[i].getKey() === "fieldName") {
                            sFieldName = aCustomData[i].getValue();
                            break;
                        }
                    }

                    if (!sFieldName) {
                        console.error("fieldName customData not found for control: " + oControl.getId());
                        return; // Skip this control
                    }
                    
                    var aControlTokens = oControl.getTokens();
                    if (aControlTokens.length > 0) {
                        // Store the array of keys (values) in our temporary storage object
                        oStorage[sFieldName] = aControlTokens.map(function(oToken) { return oToken.getKey() || oToken.getText(); });
                    }
                });
            };

            // Process both include and exclude controls, filling the oDialogData object
            fnProcessControls(aIncludeControls, oCharData.include);
            fnProcessControls(aExcludeControls, oCharData.exclude);

            // Update the central filter model with the data we just collected
            this.getView().getModel("filterModel").setProperty("/characteristicsData", oCharData);
            
            // Call the helper function to update the summary tokens on the filter bar
            this._updateCharacteristicsTokens();
            
            // Close the dialog and mark the variant as modified
            this.byId("characteristicsDialog").close();
           // this.handleVariantModification(true);
            this.onFilterChanged();
        },

        _updateCharacteristicsTokens: function() { debugger;
            var aTokens = [];
            var oCharacteristics = this.getView().getModel("filterModel").getProperty("/characteristicsData");
            
            Object.keys(oCharacteristics.include).forEach(sField => {
                if(oCharacteristics.include[sField] && oCharacteristics.include[sField].length > 0) {
                    aTokens.push(new Token({ text: `Incl. ${sField}: ${oCharacteristics.include[sField].length}` }));
                }
            });
             Object.keys(oCharacteristics.exclude).forEach(sField => {
                if(oCharacteristics.exclude[sField] && oCharacteristics.exclude[sField].length > 0) {
                    aTokens.push(new Token({ text: `Excl. ${sField}: ${oCharacteristics.exclude[sField].length}` }));
                }
            });

            this.byId("AllocReportcharacteristicsSelectionInput").setTokens(aTokens);
        },

        onCharacteristicsDialogCancel: function() {

            this.byId("characteristicsDialog").close();
          
        },
    
        // --- GENERIC VALUE HELP FUNCTIONS (for fields inside dialogs) ---

        onValueHelpRequest: function(oEvent) {
            var oSourceControl = oEvent.getSource();
            var oCustomData = oSourceControl.getCustomData();
            var oDialogModelData = {};

            oCustomData.forEach(function(oData) {
                oDialogModelData[oData.getKey()] = oData.getValue();
            });

            var sCollectionPath = "/" + oDialogModelData.collectionPath.replace(/^\//, '');

            if (!this._oValueHelpDialog) {
                Fragment.load({
                    name: "com.pg.s4.zaatpallocrpt.fiorizaatpallocrpt.fragment.FieldValueHelp", 
                    controller: this
                }).then(function (oDialog) {
                    this._oValueHelpDialog = oDialog;
                    this.getView().addDependent(this._oValueHelpDialog);
                    // **FIX**: Attach the source control directly to the dialog
                    this._oValueHelpDialog.data("sourceControl", oSourceControl);
                    this._configureAndOpenValueHelp(oDialogModelData, sCollectionPath);
                }.bind(this));
            } else {
                // **FIX**: Attach the source control directly to the dialog
                this._oValueHelpDialog.data("sourceControl", oSourceControl);
                this._configureAndOpenValueHelp(oDialogModelData, sCollectionPath);
            }
        },

        _configureAndOpenValueHelp: function(oDialogModelData, sCollectionPath) {
            var oDialogModel = new JSONModel(oDialogModelData);
            this._oValueHelpDialog.setModel(oDialogModel, "dialogModel");
            
            var oODataModel = this.getView().getModel(oDialogModelData.modelName);
            this._oValueHelpDialog.setModel(oODataModel);

            this._oValueHelpDialog.bindAggregation("items", {
                path: sCollectionPath,
                template: new sap.m.StandardListItem({
                    title: "{" + oDialogModelData.key + "}",
                    description: "{" + oDialogModelData.description + "}"
                })
            });
             // **FIX**: Apply the sorter programmatically
            var oBinding = this._oValueHelpDialog.getBinding("items");
            var oSorter = new Sorter(oDialogModelData.key, false);
            oBinding.sort(oSorter);

            this._oValueHelpDialog.open();
        },

        onValueHelpSearch: function(oEvent) {
            var sValue = oEvent.getParameter("value");
            var oDialogModel = this._oValueHelpDialog.getModel("dialogModel");
            var sKey = oDialogModel.getProperty("/key");
            var oFilter = new Filter(sKey, FilterOperator.Contains, sValue);
            oEvent.getSource().getBinding("items").filter([oFilter]);
        },

        onValueHelpOkPress: function(oEvent) {
           // **FIX**: Use 'selectedContexts' which is more reliable after searching.
            var aSelectedContexts = oEvent.getParameter("selectedContexts");
            var oSourceControl = this._oValueHelpDialog.data("sourceControl");
            var oDialogModel = this._oValueHelpDialog.getModel("dialogModel");
            var sKey = oDialogModel.getProperty("/key");
            
             if (aSelectedContexts && aSelectedContexts.length) {
                var aTokens = aSelectedContexts.map(function(oContext) {
                    var sValue = oContext.getProperty(sKey);
                    return new Token({
                        key: sValue,
                        text: sValue
                    });
                });
           oSourceControl.setTokens(aTokens);
           // this._oValueHelpDialog.close();
           // oDialog.close(); // Close the dialog from the event source
            }
            // this._oValueHelpDialog.close();

        },    
        onValueHelpCancelPress: function(oEvent) {
           // this._oValueHelpDialog.close();
          // oEvent.getSource().close(); // Get dialog from the event and close it

        },
        /**
         * Enables the 'Show Details' button if rows are selected in the event-based table.
         * @param {sap.ui.base.Event} oEvent The event object
         */
        onRowSelectionChange: function (oEvent) {
            const oTable = oEvent.getSource();
            const iSelectedIndexCount = oTable.getSelectedIndices().length;
            const oButton = this.byId("AllocReportshowDetailsButton");

            oButton.setEnabled(iSelectedIndexCount > 0);
        },
        /**
         * Filters the Order Based table and switches the tab view.
         */
        onShowDetailsPress: function () {
            const oEventTable = this.byId("AllocReporteventBasedTable");
            const aSelectedIndices = oEventTable.getSelectedIndices();
            
            if (aSelectedIndices.length === 0) {
                return; // Exit if nothing is selected
            }

            // 1. Get the CvcUuids from the selected rows
            const aSelectedCvcs = aSelectedIndices.map(iIndex => {
                const oContext = oEventTable.getContextByIndex(iIndex);
                return oContext.getProperty("CvcUuid");
            });

            // 2. Create the filter for the Order Based table
            const aFilters = aSelectedCvcs.map(sCvc => {
                return new Filter("CharcValueCombinationUUID", FilterOperator.EQ, sCvc);
            });
            const oCombinedFilter = new Filter({ filters: aFilters, and: false });

            // 3. Apply the filter to the Order Based table
            const oOrderTable = this.byId("AllocReportorderBasedTable");
            const oBinding = oOrderTable.getBinding("rows");
            oBinding.filter(oCombinedFilter);
            debugger;
            // 4. Switch the IconTabBar to the "Order Based" tab
            const oIconTabBar = this.byId("AllocReporticonTabBar");
            // console.log(oIconTabBar.getMetadata().getName());
            oIconTabBar.setSelectedKey("Order");
        },

        /**
         * Placeholder for Download button press.
        */
        onDownload: function (oEvent) {
            // This function handles the download of table data to a spreadsheet.
            var oTable, aCols;
            var oIconTabBar = this.byId("AllocReporticonTabBar");
            var sSelectedKey = oIconTabBar.getSelectedKey();
            var oModel;

            // Get the appropriate table and model based on the active tab
            if (sSelectedKey === "Event") {
                oTable = this.byId("AllocReporteventBasedTable");
                oModel = this.getOwnerComponent().getModel("eventModel");
            } else if (sSelectedKey === "Order") {
                oTable = this.byId("AllocReportorderBasedTable");
                oModel = this.getOwnerComponent().getModel("orderModel");
            } 

            // Get the binding of the table
            var oBinding = oTable.getBinding("rows");

            // Check if binding exists
            if (!oBinding) {
                MessageToast.show("Table data is not bound.");
                return;
            }

            // Get the data array from the binding contexts
            var aAllItems = oBinding.getContexts().map(function(oContext) {
                return oContext.getObject();
            });
            
            // Check if data exists before attempting to download
            if (!aAllItems || aAllItems.length === 0) {
                MessageToast.show("No data to download.");
                return;
            }

            // Get columns and data from the table
            aCols = this.createColumnConfiguration(oTable);

            var oSettings = {
                workbook: {
                    columns: aCols,
                    hierarchyLevel: 'Level',
                                     
                },
                dataSource: aAllItems,
                fileName: sSelectedKey + '_Report.xlsx'
            };

            var oSpreadsheet = new Spreadsheet(oSettings);
            oSpreadsheet.build().then(function () {
                MessageToast.show(sSelectedKey + " report has been downloaded.");
            }).finally(function () {
                oSpreadsheet.destroy();
            });
        },

        // Helper function to create column configurations for the spreadsheet
       createColumnConfiguration: function (oTable) {
            var aCols = [];
            var aColumns = oTable.getColumns();
            
            aColumns.forEach(function(oColumn) {
                var sHeaderText = oColumn.getAggregation("label").getText();
                var oTemplate = oColumn.getTemplate();
                var sProperty = "";

                if (oTemplate) {
                    var mBindings = oTemplate.mBindingInfos;
                    for (var sProp in mBindings) {
                        var oBindingInfo = mBindings[sProp];
                        if (oBindingInfo.parts && oBindingInfo.parts.length > 0) {
                            sProperty = oBindingInfo.parts[0].path;
                            break;
                        } else if (oBindingInfo.path) {
                            sProperty = oBindingInfo.path;
                            break;
                        }
                    }
                }

                if (sProperty) {
                    aCols.push({
                        label: sHeaderText,
                        property: sProperty
                    });
                }
            });
            return aCols;
        },

        /**
         * Placeholder for Edit button press.
         */
        onEdit: function() {
            var oTable = this.byId("AllocReporteventBasedTable");
            var aSelectedIndices = oTable.getSelectedIndices();
            if (aSelectedIndices.length === 0) {
                 sap.m.MessageToast.show("Please select a row to edit.");
                 return;
            }
            sap.m.MessageToast.show(aSelectedIndices.length + " row(s) selected for editing.");
        },
        onHelpBtnPressed:function(oEvent)
		{
		
			if (!this._oHelpDialog) {
				this._oHelpDialog = sap.ui.xmlfragment("com.pg.s4.zaatpallocrpt.fiorizaatpallocrpt.fragment.Help", this);
				this.getView().addDependent(this._oHelpDialog);
          
			}
			this._oHelpDialog.open();
		},
		onHelpDialogClose: function() {
            this._oHelpDialog.close();
        },
         // --- NEW FUNCTIONS FOR UOM VALUE HELP ---

        /**
         * Opens the Unit of Measure value help dialog.
         */
        onUomValueHelp: function () {
            if (!this._oUomValueHelpDialog) {
                Fragment.load({
                    name: "com.pg.s4.zaatpallocrpt.fiorizaatpallocrpt.fragment.UoMValueHelp",
                    controller: this
                }).then((oDialog) => {
                    this._oUomValueHelpDialog = oDialog;
                    this.getView().addDependent(this._oUomValueHelpDialog);
                    this._bindUomValueHelp();
                    this._oUomValueHelpDialog.open();
                });
            } else {
                this._oUomValueHelpDialog.open();
            }
        },

        /**
         * Binds the UoM value help dialog to the OData service.
         * @private
         */
        _bindUomValueHelp: function() {
            // Based on your information, the OData model for this entity is "filterModel_B"
            var oODataModel = this.getView().getModel("filterModel_B");
            this._oUomValueHelpDialog.setModel(oODataModel);

            // Create the template for the table rows dynamically
            var oTemplate = new sap.m.ColumnListItem({
                vAlign: "Middle",
                cells: [
                    new sap.m.Text({ text: "{meinh}" }), // AlternativeUnit
                    new sap.m.Text({ text: "{umren}" }), // Numerator
                    new sap.m.Text({ text: "{umrez}" }), // Denominator
                    new sap.m.Text({ text: "{meins}" }), // Base Unit of Measure
                    new sap.m.Text({ text: "{matnr}" }), // Material
                    new sap.m.Text({ text: "{ean}" })   // EAN
                ]
            });

            this._oUomValueHelpDialog.bindAggregation("items", {
                path: "/ZV_B_UOM_VH",
                template: oTemplate
            });
        },

        /**
         * Handles the search functionality within the UoM value help dialog.
         * @param {sap.ui.base.Event} oEvent The search event.
         */
        onUomValueHelpSearch: function (oEvent) {
            var sValue = oEvent.getParameter("value");
            // Create a filter that searches across multiple relevant fields
            var oFilter = new Filter({
                filters: [
                    new Filter("meinh", FilterOperator.Contains, sValue),
                    new Filter("matnr", FilterOperator.Contains, sValue),
                    new Filter("ean", FilterOperator.Contains, sValue)
                ],
                and: false // Use OR logic for a broader search
            });
            oEvent.getSource().getBinding("items").filter([oFilter]);
        },

        /**
         * Handles the confirmation of a selection in the UoM value help dialog.
         * @param {sap.ui.base.Event} oEvent The confirm event.
         */
        onUomValueHelpOk: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            if (oSelectedItem) {
                // Get the 'meinh' value from the selected row
                var sSelectedUom = oSelectedItem.getBindingContext().getProperty("meinh");
                // Update the central filter model
                this.getView().getModel("filterModel").setProperty("/allocUom", sSelectedUom);
                // Mark the variant as modified
                this.onFilterChanged();
            }
        },

        /**
         * Handles the cancellation of the UoM value help dialog.
         */
        onUomValueHelpCancel: function () {
            // No specific action needed as the dialog closes automatically.
        }
    });
});