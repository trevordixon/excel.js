/**
 * Model for an excel sheet
 **/
(function() {
"use strict";

function WorkSheet() {
}

WorkSheet.prototype = {
	name: null,
	table: null,
	selection: null,
	index: 1, // 1-indexed
	margin: { top:0.75, right:0.7, bottom:0.75, left:0.7, header:0.3, footer:0.3 }
};

return WorkSheet;

}());
