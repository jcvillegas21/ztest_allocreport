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
     "sap/ui/table/TablePersoController",
     "sap/viz/ui5/format/ChartFormatter"
     
     
    
], (Controller, formatter, Filter, FilterOperator, JSONModel, Fragment, Token, Sorter, exportLibrary, Spreadsheet, MessageToast, customVariant, PersonalizableInfo, AllocReportPersTable,TablePersoController, ChartFormatter) => {
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
                eventValidity: { from: null, to: null }, cvcTimeBucket: { from: null, to: null },
                deletionFlag: "Active"
            }), "filterModel");

            // New model for the chart data
            this.getView().setModel(new JSONModel(), "chartModel");
             // *** 1. ADD NEW MODEL FOR THE BAR CHART ***
            this.getView().setModel(new JSONModel(), "barChartModel");
             var oModel =this.getOwnerComponent().getModel('orderModel');
              var smartTbl = this.getView().byId("orderBased_idSmartTable");
                smartTbl.setModel(oModel);
                smartTbl.setEntitySet('ZV_CE_ORDER');
                smartTbl.rebindTable(true);

            
            // this._oPersoServiceEvent = AllocReportPersTable.generatePersonalisationService(this.byId("AllocReporteventBasedTable"), this);
            // this._oPersoServiceOrder = AllocReportPersTable.generatePersonalisationService(this.byId("AllocReportorderBasedTable"), this);

            // this._oTPCEvent = new TablePersoController({ table: this.byId("AllocReporteventBasedTable"), persoService: this._oPersoServiceEvent });
            // this._oTPCOrder = new TablePersoController({ table: this.byId("AllocReportorderBasedTable"), persoService: this._oPersoServiceOrder });

            
          


        },
         onBeforeRendering : function(){
                this._customVariant = new customVariant(this.createId("customVariant"),{persistencyKey:"commanKey"});
            },
        onAfterRendering : function(){

            //  // Instantiate your custom variant control
            // this._customVariant = new customVariant(this.createId("customVariant"), {
            //     persistencyKey: "commanKey"
            // });
            
            // Link the SmartVariantManagement control to your custom control
            var oPersInfoFilter = new PersonalizableInfo({
                keyName: "persistencyKey",
                type: "filterBar",
                control: this._customVariant
            });
            this._oSmartVariantManagement = this.byId("AllocReportid_allocrpt_svm");
            
            this._oSmartVariantManagement.addPersonalizableControl(oPersInfoFilter);
           
            
            // Register the callbacks for fetching and applying variant data (table Perso will be handled by TPC automatically)
            this._customVariant.registerFetchData(this.onVariantFetchData.bind(this));
            this._customVariant.registerApplyData(this.onVariantApplyData.bind(this));

             // Initialize the SmartVariantManagement control
            this._oSmartVariantManagement.initialise(() => {
                this._oSmartVariantManagement.currentVariantSetModified(false);
            }, this._customVariant);
            

           
            // // *** 2. TRIGGER THE INITIAL DATA LOAD ***
            // oEventTable.setBusy(true);
            // this.loadTableData(oEventTable, false);
            // Configure donut chart
            const oDonutChart = this.byId("allocationStatusChart");
            oDonutChart.setVizProperties({ 
                legend: {
                    title: {
                        visible: false
                    }
                },
                title: {
                    visible: true,
                    text: 'Product Allocation Order Items by Status'
                },
                plotArea: {
                    dataLabel: {
                        visible: true,
                      //  formatString: '0'
                        type: 'value' 
                    },
                    // Red, Orange, Green
                    colorPalette: ["#e74c3c", "#f39c12", "#2ecc71"]
                }
                /* ... donut chart properties ... */ });
        //  // Configure the chart properties
        //     var oChart = this.byId("allocationStatusChart");
        //     oChart.setVizProperties({
        //         legend: {
        //             title: {
        //                 visible: false
        //             }
        //         },
        //         title: {
        //             visible: true,
        //             text: 'Product Allocation Order Items by Status'
        //         },
        //         plotArea: {
        //             dataLabel: {
        //                 visible: true,
        //               //  formatString: '0'
        //                 type: 'value' 
        //             },
        //             // Red, Orange, Green
        //             colorPalette: ["#e74c3c", "#f39c12", "#2ecc71"]
        //         }
                 
                
        //     });
            // var oPopOver = this.getView().byId("idPopOver");
            // oPopOver.connect(oChart.getVizUid());
               
                 // *** 4. CONFIGURE THE NEW BAR CHART ***
            const oBarChart = this.byId("productCategoryChart");
            oBarChart.setVizProperties({
                legend: { visible: false },
                title: { visible: true, text: 'Total Allocation (IT) by Product Category' },
                plotArea: {
                    dataLabel: { visible: true }
                }
            });

             // *** NEW: Trigger chart update on initial load ***
            var oEventTable = this.byId("eventBased_idSmartTable");
         //   var oEventBinding = oEventTable.getRows();
            oEventTable.attachEventOnce("dataReceived", () => {
                 this._updateDonutChartData();
                this._updateBarChartData(); // Call the new function
                oEventTable.setBusy(false);
            });
           
                this.onSearch();
           
    },
    // onBeforeRebindTable:function()
    // {
    //         this.onSearch();     
    // },
        /**
         * Gathers the current state of filters and table layouts to be saved in a variant.
         * @returns {object} A JSON object representing the complete variant state.
         */
        onVariantFetchData: function () {

             

            const oState = {
               
                 filters: this.getView().getModel("filterModel").getData(),
                  eventTablePerso: { aColumns: AllocReportPersTable.getPersoTableColumns(this.byId("AllocReporteventBasedTable")) },
                    orderTablePerso: { aColumns: AllocReportPersTable.getPersoTableColumns(this.byId("AllocReportorderBasedTable")) }
                    
            };
            return oState;
           
 
        },
         /**
         * Applies a saved variant state to all filters and tables.
         * @param {object} oState - The JSON object containing the saved variant state.
         */
        onVariantApplyData: function (oState) { debugger;

           const isEmpty = (obj) => {return Object.keys(obj).length === 0;};
           
            var bIsStandard = isEmpty(oState.filters.characteristicsData.include)&&isEmpty(oState.filters.characteristicsData.exclude);
          
    
          
            // Handle the Standard variant
            if (bIsStandard) {
                this._clearAllFilters();
                // this._oPersoServiceEvent.resetPersData().done(() => this._oTPCEvent.refresh());
                // this._oPersoServiceOrder.resetPersData().done(() => this._oTPCOrder.refresh());
                // return;
            }

            // Apply filters
            if (oState.filters) {
                var oFilterState = JSON.parse(JSON.stringify(oState.filters));
                oFilterState.eventValidity.from = oFilterState.eventValidity.from ? new Date(oFilterState.eventValidity.from) : null;
                oFilterState.eventValidity.to = oFilterState.eventValidity.to ? new Date(oFilterState.eventValidity.to) : null;
                oFilterState.cvcTimeBucket.from = oFilterState.cvcTimeBucket.from ? new Date(oFilterState.cvcTimeBucket.from) : null;
                oFilterState.cvcTimeBucket.to = oFilterState.cvcTimeBucket.to ? new Date(oFilterState.cvcTimeBucket.to) : null;
                this.getView().getModel("filterModel").setData(oFilterState);
                this._updateCharacteristicsTokens();
            } else {
                this._clearAllFilters();
            }

            if(oState.executeOnSelection)
            {
                this.onSearch();

            }
         
           if (oState.eventTablePerso) {
            this.setVariantPersOnTable(oState.eventTablePerso, 'AllocReporteventBasedTable');
            //     this.f.setPersData(oState.eventTablePerso).done(() => {
            //         this._oTPCEvent.refresh();
            //    });
            }
            if (oState.orderTablePerso) {
                // this._oPersoServiceOrder.setPersData(oState.orderTablePerso).done(() => {
                //     this._oTPCOrder.refresh();
                // });
               this.setVariantPersOnTable(oState.orderTablePerso, 'AllocReportorderBasedTable');
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
						const aTableColumn = $.grep(this.getView().byId(tableId).getColumns(), (colObj, id) => colObj.mAggregations.label.mProperties.text=== aColumn.fieldName);
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
        
                var oModel = bIsOrderBased ? this.getView().getModel("orderModel") : this.getView().getModel(); // Your main OData Model
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

        /**
         * NEW: Processes event table data and updates the chart model.
         * @private
         */
        _updateDonutChartData: function () { debugger;
            const oTable = this.byId("AllocReporteventBasedTable");
            const oBinding = oTable.getBinding("rows");
            if (!oBinding) return;

            const aContexts = oBinding.getContexts();

            let fullyUnconfirmed = 0; // 100% -> Red
            let partiallyConfirmed = 0; // > 0% and < 100% -> Orange
            let fullyConfirmed = 0; // 0% -> Green


            aContexts.forEach(oContext => {
                const oData = oContext.getObject();
                const sValue = oData.ProdAllocPeriodLoadInPercent;
                if (sValue === null || sValue === undefined) return;

                const fValue = parseFloat(sValue);
                if (isNaN(fValue)) return;

                if (fValue === 100) {
                    fullyUnconfirmed++;
                } else if (fValue > 0 && fValue < 100) {
                    partiallyConfirmed++;
                } else if (fValue === 0) {
                    fullyConfirmed++;
                }
            });

            // The order here must match the colorPalette in onAfterRendering
            const aChartData = [{
                "Status": "Fully Unconfirmed",
                "Count": fullyUnconfirmed,
                 "Criticality": 3 
            }, {
                "Status": "Partially Confirmed",
                "Count": partiallyConfirmed,
                "Criticality": 2 
            }, {
                "Status": "Fully Confirmed",
                "Count": fullyConfirmed,
                "Criticality": 1 

            }];

            const oChartModel = this.getView().getModel("chartModel");
            oChartModel.setData({
                results: aChartData
            });
        },
       
        // *** 2. CREATE THE NEW FUNCTION TO PROCESS BAR CHART DATA ***
        _updateBarChartData: function() { debugger;
            const oTable = this.byId("AllocReporteventBasedTable");
            const oBinding = oTable.getBinding("rows");
            if (!oBinding) return;

            const aContexts = oBinding.getContexts();
            const oCategoryMap = {};

            // Group and sum quantities by Product Category
            aContexts.forEach(oContext => {
                const oData = oContext.getObject();
                const sCategory = oData.ProductCategory;
                const fQuantity = parseFloat(oData.ProductAllocationQuantity);

                if (sCategory && !isNaN(fQuantity)) {
                    if (oCategoryMap[sCategory]) {
                        oCategoryMap[sCategory] += fQuantity;
                    } else {
                        oCategoryMap[sCategory] = fQuantity;
                    }
                }
            });

            // Convert map to array for the model
            const aBarChartData = Object.keys(oCategoryMap).map(sCategory => {
                return {
                    "ProductCategory": sCategory,
                    "TotalAllocation": oCategoryMap[sCategory]
                };
            });

            this.getView().getModel("barChartModel").setData({ results: aBarChartData });
        },

        onSearch: function () {
            // var oViewModel = this.getView().getModel("viewModel");
            // var bIsOrderBasedTab = oViewModel.getProperty("/isOrderBasedTab");
            // var oTable = bIsOrderBasedTab ? this.byId("AllocReportorderBasedTable") : this.byId("AllocReporteventBasedTable");
            // var oBinding = oTable.getBinding("rows");
            // oTable.setBusy(true);
        


            // // Attach a one-time event listener to handle actions after data is received.
            // oBinding.attachEventOnce("dataReceived", () => {
            //     // If it's the event table, update the chart.
            //     if (!bIsOrderBasedTab) {
            //         this._updateChartData();
            //     }
            //     // Set the table back to not busy.
            //     oTable.setBusy(false);
            // });
            
            // // Trigger the server-side filtering. The binding will automatically handle the data request.
            // this.loadTableData(oTable, bIsOrderBasedTab);
             var oViewModel = this.getView().getModel("viewModel");
            var oFilterData = this.getView().getModel("filterModel").getData();
            var bIsOrderBasedTab = oViewModel.getProperty("/isOrderBasedTab");

            var oTable = bIsOrderBasedTab ? this.byId("AllocReportorderBasedTable") : this.byId("AllocReporteventBasedTable");
            var sPath = bIsOrderBasedTab ? "orderModel>/ZV_CE_ORDER" : "/AllocReportEvent";

            oTable.setBusy(true);

            // --- 1. Build Standard Filters ---
            var aFinalFilters = [];
            var oCharacteristics = oFilterData.characteristicsData;
            Object.keys(oCharacteristics.include).forEach(sField => {
                if (oCharacteristics.include[sField] && oCharacteristics.include[sField].length > 0) {
                    aFinalFilters.push(new Filter({ filters: oCharacteristics.include[sField].map(sValue => new Filter(sField, FilterOperator.EQ, sValue)), and: false }));
                }
            });
            Object.keys(oCharacteristics.exclude).forEach(sField => {
                 if (oCharacteristics.exclude[sField] && oCharacteristics.exclude[sField].length > 0) {
                    aFinalFilters.push(new Filter({ filters: oCharacteristics.exclude[sField].map(sValue => new Filter(sField, FilterOperator.NE, sValue)), and: false }));
                }
            });
            if (!bIsOrderBasedTab && oFilterData.deletionFlag && oFilterData.deletionFlag !== "All") {
                if (oFilterData.deletionFlag === "Active") {
                    aFinalFilters.push(new Filter({ filters: [new Filter("DelFlag", FilterOperator.NE, "X"), new Filter("DelFlag", FilterOperator.EQ, null), new Filter("DelFlag", FilterOperator.EQ, "")], and: false }));
                } else if (oFilterData.deletionFlag === "Deleted") {
                    aFinalFilters.push(new Filter("DelFlag", FilterOperator.EQ, "X"));
                }
            }
             if (!bIsOrderBasedTab && oFilterData.timeBucketType) aFinalFilters.push(new Filter("TimeBucketType", FilterOperator.EQ, oFilterData.timeBucketType));
            if (oFilterData.allocSeq) aFinalFilters.push(new Filter("Pap", FilterOperator.EQ, oFilterData.allocSeq));
            if (oFilterData.eventReason) aFinalFilters.push(new Filter("EventId", FilterOperator.EQ, oFilterData.eventReason));
            if (oFilterData.allocUom) aFinalFilters.push(new Filter("Meins", FilterOperator.EQ, oFilterData.allocUom));
            if (oFilterData.eventValidity && oFilterData.eventValidity.from && oFilterData.eventValidity.to) {
                aFinalFilters.push(new Filter("StartDate", FilterOperator.GE, oFilterData.eventValidity.from));
                aFinalFilters.push(new Filter("EndDate", FilterOperator.LE, oFilterData.eventValidity.to));
            }
            if (oFilterData.cvcTimeBucket && oFilterData.cvcTimeBucket.from && oFilterData.cvcTimeBucket.to) {
                aFinalFilters.push(new Filter("TimeBucketPeriod", FilterOperator.BT, oFilterData.cvcTimeBucket.from, oFilterData.cvcTimeBucket.to));
            }


            // --- 2. Define Binding Parameters (with Custom UoM) ---
            var oBindingParams = {
                filters: aFinalFilters,
                parameters: {
                    operationMode: 'Server',
                    countMode: 'Inline',
                    custom: {}
                }
            };

            if (oFilterData.allocUom) {
                oBindingParams.parameters.custom.P_UoM = oFilterData.allocUom;
            }

            if (!bIsOrderBasedTab) {
                oBindingParams.parameters.select = 'ProdAllocPeriodLoadInPercent';
            }


            // --- 3. Re-bind the table to trigger the new data request ---
            oTable.bindRows({
                path: sPath,
                parameters: oBindingParams.parameters,
                filters: oBindingParams.filters
            });
        var oEventTable = this.byId("eventBased_idSmartTable");
          //  var oBinding = oEventTable.getRows();
            oEventTable.attachEventOnce("dataReceived", () => {
                if (!bIsOrderBasedTab) {
                    this._updateDonutChartData();
                    this._updateBarChartData();
                }
                oTable.setBusy(false);
            });
            
        
        },

        // loadTableData: function (oTable, bIsOrderBasedTab) {
          
        //     var oBinding = oTable.getBinding("rows");
        //     var aFinalFilters = [];
        //     var oFilterData = this.getView().getModel("filterModel").getData();

        //     // --- 1. Build from Characteristics Dialog ---
        //     var oCharacteristics = oFilterData.characteristicsData;
        //     var aIncludeFilters = [];
        //     Object.keys(oCharacteristics.include).forEach(sField => {
        //         const aValues = oCharacteristics.include[sField];
        //         if (aValues && aValues.length > 0) {
        //             const aFieldFilters = aValues.map(sValue => new Filter(sField, FilterOperator.EQ, sValue));
        //             aIncludeFilters.push(new Filter({ filters: aFieldFilters, and: false }));
        //         }
        //     });
        //     if (aIncludeFilters.length > 0) {
        //         aFinalFilters.push(new Filter({ filters: aIncludeFilters, and: true }));
        //     }
        //     var aExcludeFilters = [];
        //     Object.keys(oCharacteristics.exclude).forEach(sField => {
        //         const aValues = oCharacteristics.exclude[sField];
        //         if (aValues && aValues.length > 0) {
        //             const aFieldFilters = aValues.map(sValue => new Filter(sField, FilterOperator.NE, sValue));
        //             aExcludeFilters.push(new Filter({ filters: aFieldFilters, and: false }));
        //         }
        //     });
        //     if (aExcludeFilters.length > 0) {
        //         aFinalFilters.push(new Filter({ filters: aExcludeFilters, and: true }));
        //     }
            
        //     // --- 2. Build from single FilterBar fields ---
        //     if (!bIsOrderBasedTab && oFilterData.deletionFlag && oFilterData.deletionFlag !== "All") {
        //         if (oFilterData.deletionFlag === "Active") {
        //              aFinalFilters.push(new Filter({
        //                 filters: [
        //                     new Filter("DelFlag", FilterOperator.NE, "X"),
        //                     new Filter("DelFlag", FilterOperator.EQ, null),
        //                     new Filter("DelFlag", FilterOperator.EQ, "")
        //                 ], and: false
        //             }));
        //         } else if (oFilterData.deletionFlag === "Deleted") {
        //             aFinalFilters.push(new Filter("DelFlag", FilterOperator.EQ, "X"));
        //         }
        //     }
        //     if (!bIsOrderBasedTab && oFilterData.timeBucketType) {
        //         aFinalFilters.push(new Filter("TimeBucketType", FilterOperator.EQ, oFilterData.timeBucketType));
        //     }
        //     if (oFilterData.allocSeq) {
        //         aFinalFilters.push(new Filter("Pap", FilterOperator.EQ, oFilterData.allocSeq));
        //     }
        //     if (oFilterData.eventReason) {
        //         aFinalFilters.push(new Filter("EventId", FilterOperator.EQ, oFilterData.eventReason));
        //     }
        //     if (oFilterData.allocUom) {
        //         aFinalFilters.push(new Filter("Meins", FilterOperator.EQ, oFilterData.allocUom));
        //     }
        //     if (oFilterData.eventValidity && oFilterData.eventValidity.from && oFilterData.eventValidity.to) {
        //          aFinalFilters.push(new Filter("StartDate", FilterOperator.GE, oFilterData.eventValidity.from));
        //          aFinalFilters.push(new Filter("EndDate", FilterOperator.LE, oFilterData.eventValidity.to));
        //     }
        //     if (oFilterData.cvcTimeBucket && oFilterData.cvcTimeBucket.from && oFilterData.cvcTimeBucket.to) {
        //         aFinalFilters.push(new Filter("TimeBucketPeriod", FilterOperator.BT, oFilterData.cvcTimeBucket.from, oFilterData.cvcTimeBucket.to));
        //     }

        //     // --- 3. Apply all filters to the binding ---
        //     // This single filter call will be translated into a $filter query string for the OData service
        //     oBinding.filter(new Filter({
        //         filters: aFinalFilters,
        //         and: true
        //     }));
        // },


        /**
         * Handles the 'select' event of the IconTabBar.
         * When a tab is selected, it updates the view model to show/hide the correct filters.
         * @param {sap.ui.base.Event} oEvent The event object
         */
        onTabSelect: function(oEvent) { debugger;
           const sSelectedKey = oEvent.getParameter("key");
            this.getView().getModel("viewModel").setProperty("/isOrderBasedTab", sSelectedKey === "Order");

            // // If the user selects the chart tab, force the charts to resize and render.
            // if (sSelectedKey === "Chart") {
            //     // Use a short timeout to ensure the tab content is visible in the DOM before resizing.
            //     setTimeout(() => {
            //         const oDonutChart = this.byId("allocationStatusChart");
            //         const oBarChart = this.byId("productCategoryChart");
                    
            //         window.getComputedStyle(oDonutChart.getDomRef()).height;
            //         window.getComputedStyle(oBarChart.getDomRef()).height;

            //         // ...and then notifies the chart's internal library that it needs to resize.
            //         oDonutChart.vizUpdate({
            //             'properties': {
            //                 'legend': { 'visible': false } // Re-apply a property to force redraw
            //             }
            //         });
            //          oBarChart.vizUpdate({
            //             'properties': {
            //                 'legend': { 'visible': false } // Re-apply a property to force redraw
            //             }
            //         });
            //     }, 0);
            // }
            // If the user selects the chart tab, invalidate the charts to force a redraw.
            // if (sSelectedKey === "Chart") {
            //     this.byId("allocationStatusChart").invalidate();
            //     this.byId("productCategoryChart").invalidate();
            // }
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


             const oEventTable = this.byId("eventBased_idSmartTable").getTable();//this.byId("AllocReporteventBasedTable");
            
            // 1. Get the MultiSelectionPlugin from the table's dependents
            // const oPlugin = oEventTable.getDependents().find(function(oDependent) {
            //     return oDependent.isA("sap.ui.table.plugins.MultiSelectionPlugin");
            // });

            // if (!oPlugin) {
            //     // Failsafe in case the plugin is not found
            //     console.error("MultiSelectionPlugin not found on the event table.");
            //     return;
            // }

            // 2. Get the selected indices from the PLUGIN
            const aSelectedIndices = oEventTable.getSelectedIndices();
            
            if (aSelectedIndices.length === 0) {
                return; // Exit if nothing is selected
            }

            // 3. Get the CvcUuids from the selected rows (this logic remains the same)
            const aSelectedCvcs = aSelectedIndices.map(iIndex => {
                const oContext = oEventTable.getContextByIndex(iIndex);
                return oContext ? oContext.getProperty("CvcUuid") : null;
            }).filter(sCvc => sCvc !== null); // Filter out any potential nulls if a context is not found

            // 4. Create and apply the filter (this logic remains the same)
            const aFilters = aSelectedCvcs.map(sCvc => {
                return new Filter("CharcValueCombinationUUID", FilterOperator.EQ, sCvc);
            });
            const oCombinedFilter = new Filter({ filters: aFilters, and: false });

            const oOrderTable = this.byId("AllocReportorderBasedTable");
            const oBinding = oOrderTable.getBinding("rows");
            oBinding.filter(oCombinedFilter);
            
            // 5. Switch the IconTabBar to the "Order Based" tab (this logic remains the same)
            const oIconTabBar = this.byId("AllocReporticonTabBar");
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
                oModel = this.getOwnerComponent().getModel();
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
            var oTable = this.byId("eventBased_idSmartTable").getTable();//this.byId("eventBasedTable");
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