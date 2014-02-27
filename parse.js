var parseXlsx = require('./excelParser.js');

require('fs').readdirSync(__dirname + '/test/spreadsheets').forEach(function(file) {
//  if (file != 'empty') return;
  file = __dirname + '/test/spreadsheets/' + file;
  parseXlsx(file, function(err, data) {
    console.log(file);
    console.log(err, data);
  });
});
