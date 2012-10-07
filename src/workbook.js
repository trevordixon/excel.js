/**
 * Model for an excel workbook
 **/
(function() {
"use strict";

function WorkBook() {
}

WorkBook.prototype = {
	window: { x:0, y:0, width:19200, height:10800 },
	activeTab: null,
	creator: null,
	lastModifiedBy: null,
	created: new Date(),
	modified: new Date()
};

return WorkBook;

}());
