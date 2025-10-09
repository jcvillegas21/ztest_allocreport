/*global QUnit*/

sap.ui.define([
	"com/pg/s4/zaatpallocrpt/fiorizaatpallocrpt/controller/AllocReportingMain.controller"
], function (Controller) {
	"use strict";

	QUnit.module("AllocReportingMain Controller");

	QUnit.test("I should test the AllocReportingMain controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
