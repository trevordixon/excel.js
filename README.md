Excel.js [![Build Status](https://travis-ci.org/trevordixon/excel.js.svg?branch=master)](https://travis-ci.org/trevordixon/excel.js)
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
    
If you have multiple sheets in your spreadsheet, 

    parseXlsx('Spreadsheet.xlsx', '2', function(err, data) {
    	if(err) throw err;
        // data is an array of arrays
    });
    
Test
=====
Run `npm test`

MIT License.

**Thanks to [all other contributors](https://github.com/trevordixon/excel.js/graphs/contributors).**
