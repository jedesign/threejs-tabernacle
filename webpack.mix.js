let mix = require('laravel-mix');


mix
    .js('src/main.js', 'dist/')
    .browserSync({
        files: [
            'dist/*.*',
            '*.html'
        ],
        server: true,
        notify: false,
        open: false,
        proxy: false
    })
    .disableNotifications();