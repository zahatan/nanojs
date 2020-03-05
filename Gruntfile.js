'use strict';

module.exports = function (grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            nano: {
                src: ['src/core/*.js', 'src/processors/*.js', 'src/utils/*.js'],
                dest: 'dist/nano.js',
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');

    grunt.registerTask('default', ['concat']);

};
