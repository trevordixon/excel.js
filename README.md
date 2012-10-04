Excel.js
========

Native node.js Excel file parser. Only supports xlsx for now.

Install
=======
    npm install excel

Use
====
    var parseXlsx = require('excel');

    parseXlsx('Spreadsheet.xlsx', function(data) {
        // data is an array of arrays
    });
    
MIT License.