var parseXlsx = require('../excelParser');
var assert = require('assert');

var sheetsDir = __dirname + '/spreadsheets';
var sheets = {
  'excel_mac_2011-basic.xlsx': [ [ 'One', 'Two' ], [ 'Three', 'Four' ] ],
  'excel_mac_2011-formatting.xlsx': [ [ 'Hey', 'now', 'so' ], [ 'cool', '', '' ] ]
};

describe('excel.js', function() {
  for (var filename in sheets) {
    (function(filename, expected) {

      describe(filename + ' basic test', function() {
        it('should return the right value', function(done) {
          parseXlsx(sheetsDir + '/' + filename, function(err, data) {
            assert.deepEqual(data, expected);
            done(err);
          });
        })
        it('should return the right value with the sheet specified', function(done) {
          parseXlsx(sheetsDir + '/' + filename, '1', function(err, data) {
            assert.deepEqual(data, expected);
            done(err);
          });
        })
      });

    })(filename, sheets[filename]);
  }
});
