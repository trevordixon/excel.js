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
    
MIT License.

*Author: Trevor Dixon <trevordixon@gmail.com>*

Contributors: 
- Jake Scott <scott.iroh@gmail.com>
- Fabian Tollenaar <fabian@startingpoint.nl> (Just a small contribution, really)