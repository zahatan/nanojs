'use strict';

module.exports = function (grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            nano: {
                src: [
                      'src/core/object.js'
                      , 'src/core/option.js'
                      , 'src/core/listener.js'
                      , 'src/core/listenable.js'
                      , 'src/core/view.js'
                      , 'src/core/model.js'
                      , 'src/core/request.js'
                      , 'src/core/template.js'
                      , 'src/core/template.context.js'
                      , 'src/core/template.processor.js'
                    , 'src/helpers/*.js'
                    , 'src/processors/*.js'
                    , 'src/utils/*.js'
                ],
                dest: 'dist/nano.js',
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');

    grunt.registerTask('default', ['concat']);

};
