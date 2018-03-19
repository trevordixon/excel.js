import fs from 'fs';
import Stream from 'stream';
import unzip from 'unzipper';
import xpath from 'xpath';
import XMLDOM from 'xmldom';

const ns = { a: 'http://schemas.openxmlformats.org/spreadsheetml/2006/main' };
const select = xpath.useNamespaces(ns);

const letters = ["", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];

function extractFiles(path, sheet) {
  const files = {
    strings: {},
    sheet: {},
    'xl/sharedStrings.xml': 'strings',
    [`xl/worksheets/sheet${sheet}.xml`]: 'sheet'
  };

  const stream = path instanceof Stream ? path : fs.createReadStream(path);

  return new Promise((resolve, reject) => {
    const filePromises = [];

    stream
      .pipe(unzip.Parse())
      .on('error', reject)
      .on('close', () => {
        Promise.all(filePromises).then(() => resolve(files));
      })
      // For some reason `end` event is not emitted.
      // .on('end', () => {
      //   Promise.all(filePromises).then(() => resolve(files));
      // })
      .on('entry', (entry) => {
        const file = files[entry.path];
        if (file) {
          let contents = '';
          filePromises.push(new Promise((resolve) => {
            entry
              .on('data', data => contents += data.toString())
              .on('end', () => {
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

function calculateDimensions (cells) {
  const comparator = (a, b) => a - b;
  const allRows = cells.map(cell => cell.row).sort(comparator);
  const allCols = cells.map(cell => cell.column).sort(comparator);
  const minRow = allRows[0];
  const maxRow = allRows[allRows.length - 1];
  const minCol = allCols[0];
  const maxCol = allCols[allCols.length - 1];

  return [
    { row: minRow, column: minCol },
    { row: maxRow, column: maxCol }
  ];
}

function extractData(files) {
  let sheet;
  let values;
  const data = [];

  try {
    sheet = new XMLDOM.DOMParser().parseFromString(files.sheet.contents);
    const valuesDoc = new XMLDOM.DOMParser().parseFromString(files.strings.contents);
    values = select('//a:si', valuesDoc)
      .map(string => select('.//a:t[not(ancestor::a:rPh)]', string).map(_ => _.textContent).join(''));
  } catch(parseError){
    return [];
  }

  const cells = select('/a:worksheet/a:sheetData/a:row/a:c', sheet).map(Cell);

  let d = select('//a:dimension/@ref', sheet, 1);
  if (d) {
    d = d.textContent.split(':').map(CellCoords);
  } else {
    d = calculateDimensions(cells);
  }

  const cols = d[1].column - d[0].column + 1;
  const rows = d[1].row - d[0].row + 1;

  times(rows, () => {
    const row = [];
    times(cols, () => row.push(''));
    data.push(row);
  });

  for (const cell of cells) {
    let value = cell.value;

    if (cell.type === 's') {
      value = values[parseInt(value)];
    }

    if (data[cell.row - d[0].row]) {
      data[cell.row - d[0].row][cell.column - d[0].column] = value;
    }
  }

  if (data.length === 0) {
    return [];
  }

  // Trim trailing empty columns.
  let i = data[0].length - 1;
  while (i >= 0) {
    let notEmpty;
    for (const row of data) {
      if (row[i]) {
        // Column is not empty.
        notEmpty = true;
        break;
      }
    }
    if (notEmpty) {
      break;
    }
    let j = 0;
    while (j < data.length) {
      data[j].splice(i, 1);
      j++;
    }
    i--;
  }

  return data;
}

export default function parseXlsx(path, sheet = '1') {
  return extractFiles(path, sheet).then((files) => extractData(files));
};

function times(n, action) {
  let i = 0;
  while (i < n) {
    action();
    i++;
  }
}

function colToInt(col) {
  col = col.trim().split('');

  let n = 0;

  for (let i = 0; i < col.length; i++) {
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
  const coords = CellCoords(cellNode.getAttribute('r'));
  const value = select('a:v', cellNode, 1);
  return {
    column: coords.column,
    row: coords.row,
    value: value && value.textContent && value.textContent.trim() || '',
    type: cellNode.getAttribute('t')
  };
}