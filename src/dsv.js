/**
 * Functions to parse and stringify tsv and dsv files.
 **/
(function() {
"use strict";

var DSV = {
	parse: function(dsv, reviver, field, record) {
		field = field || '\t'; record = record || '\n';
		reviver = reviver || function(r, c, v) { return v; };
		var table = dsv.replace(/\r?\n|\r/g, '\n').split(record),
			r, rr = table.length, c, cc;
		for (r = 0; r < rr; ++r) {
			table[r] = table[r].split(field);
			for (c = 0, cc = table[r].length; c < cc; ++c) {
				table[r][c] = reviver(r, c, table[r][c]);
				if (!isNaN(table[r][c])) { table[r][c] = +table[r][c]; }
			}
		}
		return table;
	},

	stringify: function(table, replacer, field, record) {
		field = field || '\t'; record = record || '\r\n';
		replacer = replacer || function(r, c, v) { return v; };
		var esc = /([\^\$\[\]\.\+\*\?\(\)\\\|\/])/g, rpl = '\\$1',
			rex = new RegExp(field.replace(esc, rpl) + '|' + record.replace(esc, rpl), 'g'),
			dsv = '', r, rr = table.length, c, cc, cell;
		for (r = 0;  r < rr; ++r) {
			if (r) { dsv += record; }
			for (c = 0, cc = table[r].length; c < cc; ++c) {
				if (c) { dsv += field; }
				cell = replacer(r, c, table[r][c]);
				if (rex.test(cell)) { cell = cell.replace(rex, ''); }
				dsv += (cell || 0 === cell) ? cell : '';
			}
		}
		return dsv;
	}
};

return DSV;

}());