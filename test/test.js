var parseXlsx = require('../excelParser');
var assert = require('assert');

var sheetsDir = __dirname + '/spreadsheets';
var sheets = {
  'excel_mac_2011-basic.xlsx': { 1: [ [ 'One', 'Two' ], [ 'Three', 'Four' ] ], 2: [ [ 'a', 'b' ], [ 'c', 'd' ] ] },
  'excel_mac_2011-formatting.xlsx': { 1: [ [ 'Hey', 'now', 'so' ], [ 'cool', '', '' ] ] }
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
      });

    })(filename, sheets[filename][1]);

    describe('excel_mac_2011-basic.xlsx multiple sheet test', function() {
      it('should return the right value', function(done) {
        parseXlsx(sheetsDir + '/excel_mac_2011-basic.xlsx', Object.keys(sheets['excel_mac_2011-basic.xlsx']), function(err, data) {
          for (var i = 0; i < data.length; i++) {
            var contents = data[i].contents;
            var expected = sheets['excel_mac_2011-basic.xlsx'][data[i].num];
            assert.deepEqual(contents, expected);
          }
          done(err);
        });
      });
    });
  }
});
