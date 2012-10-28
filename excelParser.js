var Promise = require('node-promise'),
	defer = Promise.defer,
	when = Promise.when,
	all = Promise.all,
	_ = require('underscore');

function extractFiles(path) {
	var unzip = require('unzip'),
		deferred = defer();

	var files = {
		'xl/worksheets/sheet1.xml': {
			deferred: defer()
		},
		'xl/sharedStrings.xml': {
			deferred: defer()
		}
	};

	require('fs').createReadStream(path)
		.pipe(unzip.Parse())
		.on('entry', function(entry) {
			if (files[entry.path]) {
				var contents = '';
				entry.on('data', function(data) {
					contents += data.toString();
				}).on('end', function() {
					files[entry.path].contents = contents;
					files[entry.path].deferred.resolve();
				});
			}
		});

	when(all(_.pluck(files, 'deferred')), function() {
		deferred.resolve(files);
	});

	return deferred.promise;
}

function extractData(files) {
	var libxmljs = require('libxmljs'),
		sheet = libxmljs.parseXml(files['xl/worksheets/sheet1.xml'].contents),
		strings = libxmljs.parseXml(files['xl/sharedStrings.xml'].contents),
		ns = {a: 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'},
		data = [];

	var colToInt = function(col) {
		var letters = ["", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
		var col = col.trim().split('');
		
		var n = 0;

		for (var i = 0; i < col.length; i++) {
			n *= 26;
			n += letters.indexOf(col[i]);
		}

		return n;
	};

	var Cell = function(cell) {
		cell = cell.split(/([0-9]+)/);
		this.row = parseInt(cell[1]);
		this.column = colToInt(cell[0]);
	};

	var d = sheet.get('//a:dimension/@ref', ns).value().split(':');

	d = _.map(d, function(v) { return new Cell(v); });

	var cols = d[1].column - d[0].column + 1,
		rows = d[1].row - d[0].row + 1;

	_(rows).times(function() {
		var _row = [];
		_(cols).times(function() { _row.push(''); });
		data.push(_row);
	});

	var cells = sheet.find('//a:sheetData//a:row//a:c', ns),
		na = { value: function() { return ''; },
           text:  function() { return ''; } };

	_.each(cells, function(_cell) {
		var r = _cell.attr('r').value(),
			type = (_cell.attr('t') || na).value(),
			value = ( _cell.get('a:v', ns) || na ).text(),
			cell = new Cell(r);

		if (type == 's') value = strings.get('//a:si[' + (parseInt(value) + 1) + ']//a:t', ns).text();

		data[cell.row - d[0].row][cell.column - d[0].column] = value;
	});

	return data;
}

module.exports = function parseXlsx(path, cb) {
	extractFiles(path).then(function(files) {
		cb(extractData(files));
	});
};
