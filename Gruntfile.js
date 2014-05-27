/*global module */
module.exports = function(grunt) {
	'use strict';

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		banner: '/*!\n * Slime touch scroller\n * v. <%= pkg.version %> | <%= pkg.homepage %>\n * Copyright <%= pkg.author.name %> | <%= pkg.author.url %>\n *\n * Depends on Event Burrito (included) | https://github.com/wilddeer/Event-Burrito\n * MIT License\n */\n',
		bannerPure: '/*!\n * Slime touch scroller\n * v. <%= pkg.version %> | <%= pkg.homepage %>\n * Copyright <%= pkg.author.name %> | <%= pkg.author.url %>\n *\n * Depends on Event Burrito | https://github.com/wilddeer/Event-Burrito\n * MIT License\n */\n',
		uglify: {
			options: {
				mangle: {
					except: ['SlimeScroller', '$', 'jQuery', 'EventBurrito']
				}
			},
			slime: {
				files: {
					'temp/slimescroller.min.js': ['src/slimescroller.js']
				}
			},
			burrito: {
				files: {
					'temp/eventburrito.min.js': ['src/burrito/eventburrito.js']
				}
			}
		},

		concat: {
			options: {
				banner: '<%= banner %>',
				separator: '\n'
			},
			full: {
				src: ['src/slimescroller.js','src/burrito/eventburrito.js'],
				dest: 'dist/slimescroller.js',
			},
			min: {
				src: ['temp/slimescroller.min.js','temp/eventburrito.min.js'],
				dest: 'dist/slimescroller.min.js',
			},
			pureFull: {
				options: {
					banner: '<%= bannerPure %>'
				},
				src: ['src/slimescroller.js'],
				dest: 'dist/pure/slimescroller.pure.js'
			},
			pureMin: {
				options: {
					banner: '<%= bannerPure %>'
				},
				src: ['temp/slimescroller.min.js'],
				dest: 'dist/pure/slimescroller.pure.min.js'
			},
			cssRequired: {
				options: {
					banner: '/* Slime scroller */\n\n'
				},
				src: ['src/slimescroller.css'],
				dest: 'dist/slimescroller.css'
			}
		},

		watch: {
			files: ['src/*.js', 'package.json'],
			tasks: ['build']
		},
	});

	// build
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.registerTask('build', ['uglify', 'concat']);
	grunt.registerTask('w', ['build', 'watch']);
	grunt.registerTask('default', 'build');
};