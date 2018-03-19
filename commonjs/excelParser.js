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

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var ns = { a: 'http://schemas.openxmlformats.org/spreadsheetml/2006/main' };
var select = _xpath2.default.useNamespaces(ns);

var letters = ["", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];

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
      return select('.//a:t[not(ancestor::a:rPh)]', string).map(function (_) {
        return _.textContent;
      }).join('');
    });
  } catch (parseError) {
    return [];
  }

  var cells = select('/a:worksheet/a:sheetData/a:row/a:c', sheet).map(Cell);

  var d = select('//a:dimension/@ref', sheet, 1);
  if (d) {
    d = d.textContent.split(':').map(CellCoords);
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

      if (cell.type === 's') {
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

  if (data.length === 0) {
    return [];
  }

  // Trim trailing empty columns.
  var i = data[0].length - 1;
  while (i >= 0) {
    var notEmpty = void 0;
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _iterator2 = data[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        var row = _step2.value;

        if (row[i]) {
          // Column is not empty.
          notEmpty = true;
          break;
        }
      }
    } catch (err) {
      _didIteratorError2 = true;
      _iteratorError2 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion2 && _iterator2.return) {
          _iterator2.return();
        }
      } finally {
        if (_didIteratorError2) {
          throw _iteratorError2;
        }
      }
    }

    if (notEmpty) {
      break;
    }
    var j = 0;
    while (j < data.length) {
      data[j].splice(i, 1);
      j++;
    }
    i--;
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

function colToInt(col) {
  col = col.trim().split('');

  var n = 0;

  for (var i = 0; i < col.length; i++) {
    n *= 26;
    n += letters.indexOf(col[i]);
  }

  return n;
};

function CellCoords(coords) {
  coords = coords.split(/(\d+)/);
  return {
    row: parseInt(coords[1]),
    column: colToInt(coords[0])
  };
}

function Cell(cellNode) {
  var coords = CellCoords(cellNode.getAttribute('r'));
  var value = select('a:v', cellNode, 1);
  return {
    column: coords.column,
    row: coords.row,
    value: value && value.textContent && value.textContent.trim() || '',
    type: cellNode.getAttribute('t')
  };
}
//# sourceMappingURL=excelParser.js.map