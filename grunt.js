"use strict";
module.exports = function(grunt) {
	// Project configuration.
	grunt.initConfig({
		pkg: '<json:package.json>',
		meta: {
			banner:
				'/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
				'<%= grunt.template.today("yyyy-mm-dd") %>\n' +
				'<%= pkg.homepage ? " * " + pkg.homepage + "\n" : "" %>' +
				' */\n\n' +

				'/*!\n' +
				' * ************************************************************************\n' +
				' *\n' +
				' * The MIT License (MIT)\n' +
				' * Copyright (c) <%= grunt.template.today("yyyy") %> Trevor Dixon, Andy VanWagoner\n' +
				' *\n' +
				' * Permission is hereby granted, free of charge, to any person obtaining a\n' +
				' * copy of this software and associated documentation files (the "Software"),\n' +
				' * to deal in the Software without restriction, including without limitation\n' +
				' * the rights to use, copy, modify, merge, publish, distribute, sublicense,\n' +
				' * and/or sell copies of the Software, and to permit persons to whom the\n' +
				' * Software is furnished to do so, subject to the following conditions:\n' +
				' *\n' +
				' * The above copyright notice and this permission notice shall be included\n' +
				' * in all copies or substantial portions of the Software.\n' +
				' *\n' +
				' * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS\n' +
				' * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\n' +
				' * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL\n' +
				' * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\n' +
				' * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING\n' +
				' * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER\n' +
				' * DEALINGS IN THE SOFTWARE.\n' +
				' * ************************************************************************\n' +
				' */',
			start: '(function(){"use strict";',
			stop: '}());'
		},
		clean: {
			files: [ '<config:tpl.dist.dest>', '<config:concat.dist.dest>', '<config:min.dist.dest>' ]
		},
		tpl: {
			dist: {
				src: [ 'src/tpl/**/*' ],
				dest: 'src/tpl.js'
			}
		},
		concat: {
			dist: {
				src: [ '<banner:meta.banner>', '<banner:meta.start>', 'src/**/*.js', '<banner:meta.stop>' ],
				dest: '<%= pkg.name %>.js'
			}
		},
		min: {
			dist: {
				src: [ '<banner:meta.banner>', '<config:concat.dist.dest>' ],
				dest: '<%= pkg.name %>.min.js'
			}
		},
		test: {
			files: [ 'test/**/*.js' ]
		},
		lint: {
			files: [ 'src/**/*.js' ]
		},
		jshint: {
			options: {
				curly: false, // require curly braces on all ifs
				eqeqeq: false, // require ===
				immed: true,
				latedef: true,
				newcap: true,
				noarg: true,
				sub: true,
				undef: true,
				boss: true,
				eqnull: true,

				strict: true,
				validthis: true, // assume you know what you are doing with `this`
				trailing: true // flag training whitespace
			},
			globals: {
			}
		},
		uglify: {}
	});

	// Default task.
	grunt.registerTask('default', 'clean lint test tpl concat min');

	grunt.registerMultiTask('tpl', 'Package all of the templates into js functions', function() {
		var files = grunt.file.expandFiles(this.file.src),
			tpls = {}, stencil = require('stencil-js');
		stencil.defaults.noevents = true;
		files.forEach(function(file) {
			var tpl = grunt.file.read(file);
			tpls[file.replace(/^src\/tpl\/|\s+/g, '')] = stencil.compile(tpl, true);
		});
		
		var k, content = 'var templates = {\n';
		for (k in tpls) { content += '\t' + JSON.stringify(k) + ': ' + tpls[k] + ',\n'; }
		content = content.replace(/,\n$/, '\n');
		content += '\n};\n';
		grunt.file.write(this.file.dest, content);
		grunt.log.writeln('File "' + this.file.dest + '" created.');
	});

	grunt.registerMultiTask('clean', 'Remove build files', function() {
		var files = grunt.file.expandFiles(this.file.src), fs = require('fs');
		files.forEach(fs.unlinkSync);
		grunt.log.writeln('Clean.');
	});
};
