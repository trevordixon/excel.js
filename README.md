Excel.js
========

Native node.js Excel file parser. Only supports xlsx for now.

Install
=======
    As this fork isn't pulled by the author (yet?), you've to install this 
    using git. 

    1. Open a Terminal
    2. `$ cd /your/project/directory/node_modules`
    3. `$ git clone git@github.com:fabdrol/excel.js.git excel && cd excel`
    4. `$ npm install .`

    Now, officially, NPM should support installation from github right away, but that doesn't work for me (tar errors). However, the steps outlined above should work perfectly. Remember to do them over if you move your project to a different machine without it's node_modules folder (which you should)!


Use
====
    var xlsxParser = require('excel');

    xlsxParser('Spreadsheet.xlsx', function(err, data) {
        if(err) return console.error(err)
        /** 
         * Data is presented as an array (rows) of arrays (columns).
         *
         * Do something with the data here... 
        **/
    });
    
MIT License.