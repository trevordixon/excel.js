/**
 * Functions to parse and stringify csv files.
 **/
(function() {
"use strict";

var CSV = {
	parse: function(csv, reviver) {
		reviver = reviver || function(r, c, v) { return v; };
		var chars = csv.split(''), c = 0, cc = chars.length, start, end, table = [], row;
		while (c < cc) {
			table.push(row = []);
			while (c < cc && '\r' !== chars[c] && '\n' !== chars[c]) {
				start = end = c;
				if ('"' === chars[c]){
					start = end = ++c;
					while (c < cc) {
						if ('"' === chars[c]) {
							if ('"' !== chars[c+1]) { break; }
							else { chars[++c] = ''; } // unescape ""
						}
						end = ++c;
					}
					if ('"' === chars[c]) { ++c; }
					while (c < cc && '\r' !== chars[c] && '\n' !== chars[c] && ',' !== chars[c]) { ++c; }
				} else {
					while (c < cc && '\r' !== chars[c] && '\n' !== chars[c] && ',' !== chars[c]) { end = ++c; }
				}
				end = reviver(table.length-1, row.length, chars.slice(start, end).join(''));
				row.push(isNaN(end) ? end : +end);
				if (',' === chars[c]) { ++c; }
			}
			if ('\r' === chars[c]) { ++c; }
			if ('\n' === chars[c]) { ++c; }
		}
		return table;
	},

	stringify: function(table, replacer) {
		replacer = replacer || function(r, c, v) { return v; };
		var csv = '', c, cc, r, rr = table.length, cell;
		for (r = 0; r < rr; ++r) {
			if (r) { csv += '\r\n'; }
			for (c = 0, cc = table[r].length; c < cc; ++c) {
				if (c) { csv += ','; }
				cell = replacer(r, c, table[r][c]);
				if (/[,\r\n"]/.test(cell)) { cell = '"' + cell.replace(/"/g, '""') + '"'; }
				csv += (cell || 0 === cell) ? cell : '';
			}
		}
		return csv;
	}
};

return CSV;

}());