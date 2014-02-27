Excel.js
========

Native node.js Excel file parser. Only supports xlsx for now.

Install
=======
    npm install excel

Use
====
    var parseXlsx = require('excel');

    parseXlsx('Spreadsheet.xlsx', function(err, data) {
      if(err) throw err;
        // data is an array of arrays
    });
    
Test
=====
Run `npm test`

MIT License.

**Thanks to [all other contributors](https://github.com/trevordixon/excel.js/graphs/contributors).**