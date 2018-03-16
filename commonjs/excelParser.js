'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = parseXlsx;

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _stream = require('stream');

var _stream2 = _interopRequireDefault(_stream);

var _unzipper = require('unzipper');

var _unzipper2 = _interopRequireDefault(_unzipper);

var _xpath = require('xpath');

var _xpath2 = _interopRequireDefault(_xpath);

var _xmldom = require('xmldom');

var _xmldom2 = _interopRequireDefault(_xmldom);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var ns = { a: 'http://schemas.openxmlformats.org/spreadsheetml/2006/main' };
var select = _xpath2.default.useNamespaces(ns);

function extractFiles(path, sheet) {
  var files = _defineProperty({
    strings: {},
    sheet: {},
    'xl/sharedStrings.xml': 'strings'
  }, 'xl/worksheets/sheet' + sheet + '.xml', 'sheet');

  var stream = path instanceof _stream2.default ? path : _fs2.default.createReadStream(path);

  return new Promise(function (resolve, reject) {
    var filePromises = [];

    stream.pipe(_unzipper2.default.Parse()).on('error', reject).on('close', function () {
      Promise.all(filePromises).then(function () {
        return resolve(files);
      });
    })
    // For some reason `end` event is not emitted.
    // .on('end', () => {
    //   Promise.all(filePromises).then(() => resolve(files));
    // })
    .on('entry', function (entry) {
      var file = files[entry.path];
      if (file) {
        var contents = '';
        filePromises.push(new Promise(function (resolve) {
          entry.on('data', function (data) {
            return contents += data.toString();
          }).on('end', function () {
            files[file].contents = contents;
            resolve();
          });
        }));
      } else {
        entry.autodrain();
      }
    });
  });
}

function calculateDimensions(cells) {
  var comparator = function comparator(a, b) {
    return a - b;
  };
  var allRows = cells.map(function (cell) {
    return cell.row;
  }).sort(comparator);
  var allCols = cells.map(function (cell) {
    return cell.column;
  }).sort(comparator);
  var minRow = allRows[0];
  var maxRow = allRows[allRows.length - 1];
  var minCol = allCols[0];
  var maxCol = allCols[allCols.length - 1];

  return [{ row: minRow, column: minCol }, { row: maxRow, column: maxCol }];
}

function extractData(files) {
  var sheet = void 0;
  var values = void 0;
  var data = [];

  try {
    sheet = new _xmldom2.default.DOMParser().parseFromString(files.sheet.contents);
    var valuesDoc = new _xmldom2.default.DOMParser().parseFromString(files.strings.contents);
    values = select('//a:si', valuesDoc).map(function (string) {
      return select('.//a:t[not(ancestor::a:rPh)]', string).map(function (t) {
        return t.textContent;
      }).join('');
    });
  } catch (parseError) {
    return [];
  }

  function colToInt(col) {
    var letters = ["", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
    col = col.trim().split('');

    var n = 0;

    for (var i = 0; i < col.length; i++) {
      n *= 26;
      n += letters.indexOf(col[i]);
    }

    return n;
  };

  var na = {
    textContent: ''
  };

  var CellCoords = function CellCoords(cell) {
    _classCallCheck(this, CellCoords);

    cell = cell.split(/([0-9]+)/);
    this.row = parseInt(cell[1]);
    this.column = colToInt(cell[0]);
  };

  var Cell = function Cell(cellNode) {
    _classCallCheck(this, Cell);

    var r = cellNode.getAttribute('r');
    var type = cellNode.getAttribute('t') || '';
    var value = (select('a:v', cellNode, 1) || na).textContent;
    var coords = new CellCoords(r);

    this.column = coords.column;
    this.row = coords.row;
    this.value = value;
    this.type = type;
  };

  var cells = select('/a:worksheet/a:sheetData/a:row/a:c', sheet).map(function (node) {
    return new Cell(node);
  });

  var d = select('//a:dimension/@ref', sheet, 1);
  if (d) {
    d = d.textContent.split(':').map(function (_) {
      return new CellCoords(_);
    });
  } else {
    d = calculateDimensions(cells);
  }

  var cols = d[1].column - d[0].column + 1;
  var rows = d[1].row - d[0].row + 1;

  times(rows, function () {
    var row = [];
    times(cols, function () {
      return row.push('');
    });
    data.push(row);
  });

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = cells[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var cell = _step.value;

      var value = cell.value;

      if (cell.type == 's') {
        value = values[parseInt(value)];
      }

      if (data[cell.row - d[0].row]) {
        data[cell.row - d[0].row][cell.column - d[0].column] = value;
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return data;
}

function parseXlsx(path) {
  var sheet = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '1';

  return extractFiles(path, sheet).then(function (files) {
    return extractData(files);
  });
};

function times(n, action) {
  var i = 0;
  while (i < n) {
    action();
    i++;
  }
}
//# sourceMappingURL=excelParser.js.map