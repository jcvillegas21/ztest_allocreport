sap.ui.define([
    "sap/ui/core/format/DateFormat"
], function (DateFormat) {
    "use strict";

    return {
        /**
		 * Formats a date object or string into "MM.dd.yyyy" format.
		 * @param {Date|string} vDate The date to format.
		 * @returns {string} The formatted date string, or the original value if invalid.
		 */
        formatDate: function (vDate) {

            

            if (!vDate) {
                return "";
            }

            var oDateFormat = sap.ui.core.format.DateFormat.getDateInstance();
            return oDateFormat.format(vDate);
            

            // // The incoming date can be a string, so we need to create a Date object from it.
            // var oDate = new Date(vDate);

            // // Check if the date is valid before formatting
            // if (oDate instanceof Date && !isNaN(oDate)) {
            //     // Get the date pattern instance for "MM.dd.yyyy"
            //     var oDateFormat = DateFormat.getDateInstance({
            //         pattern: "yyyy-MM-dd"
            //     });
            //     return oDateFormat.format(oDate);   
            // } else{
            //     // If the date is not valid, return the original value
            //     return vDate;
            // }
        }
    };
});