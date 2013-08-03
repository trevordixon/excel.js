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

    var noop = function () {};
	
	var srcStream = path instanceof require('stream') ?
		path :
		require('fs').createReadStream(path);

	srcStream
		.pipe(unzip.Parse())
		.on('error', function(err) {
			deferred.reject(err);
		})
		.on('entry', function(entry) {
			if (files[entry.path]) {
				var contents = '';
				entry.on('data', function(data) {
					contents += data.toString();
				}).on('end', function() {
					files[entry.path].contents = contents;
					files[entry.path].deferred.resolve();
				});
			} else {
                entry.on('data', noop); // otherwise unzip.Parse() will hang forever on this entry on some xlsx files
            }
		});

	when(all(_.pluck(files, 'deferred')), function() {
		deferred.resolve(files);
	});

	return deferred.promise;
}

function calculateDimensions (cells) {
    var comparator = function (a, b) { return a-b; };
    var allRows = _(cells).map(function (cell) { return cell.row; }).sort(comparator),
        allCols = _(cells).map(function (cell) { return cell.column; }).sort(comparator),
        minRow = allRows[0],
        maxRow = _.last(allRows),
        minCol = allCols[0],
        maxCol = _.last(allCols);

    return [
        {row: minRow, column: minCol},
        {row: maxRow, column: maxCol}
    ];
}

function extractData(files) {
	var libxmljs = require('libxmljs'),
		sheet = libxmljs.parseXml(files['xl/worksheets/sheet1.xml'].contents),
		strings = libxmljs.parseXml(files['xl/sharedStrings.xml'].contents),
		ns = {a: 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'},
		data = [];

	var colToInt = function(col) {
		var letters = ["", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
		col = col.trim().split('');
		
		var n = 0;

		for (var i = 0; i < col.length; i++) {
			n *= 26;
			n += letters.indexOf(col[i]);
		}

		return n;
	};

	var CellCoords = function(cell) {
		cell = cell.split(/([0-9]+)/);
		this.row = parseInt(cell[1]);
		this.column = colToInt(cell[0]);
	};

	var na = { value: function() { return ''; },
        text:  function() { return ''; } };

	var Cell = function(cellNode) {
		var r = cellNode.attr('r').value(),
			type = (cellNode.attr('t') || na).value(),
			value = (cellNode.get('a:v', ns) || na ).text(),
			coords = new CellCoords(r);

		this.column = coords.column;
		this.row = coords.row;
		this.value = value;
		this.type = type;
	};

	var cellNodes = sheet.find('//a:sheetData//a:row//a:c', ns);
	var cells = _(cellNodes).map(function (node) {
		return new Cell(node);
	});

	var d = sheet.get('//a:dimension/@ref', ns);
	if (d) {
		d = _.map(d.value().split(':'), function(v) { return new CellCoords(v); });
	} else {
        d = calculateDimensions(cells)
	}

	var cols = d[1].column - d[0].column + 1,
		rows = d[1].row - d[0].row + 1;

	_(rows).times(function() {
		var _row = [];
		_(cols).times(function() { _row.push(''); });
		data.push(_row);
	});

	_.each(cells, function(cell) {
		var value = cell.value;

		if (cell.type == 's') value = strings.get('//a:si[' + (parseInt(value) + 1) + ']//a:t', ns).text();

		data[cell.row - d[0].row][cell.column - d[0].column] = value;
	});

	return data;
}

module.exports = function parseXlsx(path, cb) {
	extractFiles(path).then(function(files) {
		cb(null, extractData(files));
	},
	function(err) {
		cb(err);
	});
};
