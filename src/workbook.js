/**
 * Model for an excel workbook
 **/
function WorkBook() {
}

WorkBook.prototype = {
	window: { x:0, y:0, width:19200, height:10800 },
	activeTab: 1, // 1-indexed
	creator: null,
	lastModifiedBy: null,
	created: new Date(),
	modified: new Date()
};
