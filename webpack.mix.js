let mix = require('laravel-mix');


mix
    .sass('src/scss/main.scss', 'dist/css')
    .js('src/js/main.js', 'dist/js')
    .browserSync({
        files: [
            'dist/**/*.*',
            '*.html'
        ],
        https: true,
        server: true,
        notify: false,
        open: false,
        proxy: false
    })
    .disableNotifications();