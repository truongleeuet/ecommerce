const gulp = require('gulp');
const pm2 = require('pm2');

gulp.task('server', function() {
    pm2.connect(true, function(err) {
        if (err) {
            console.log(err);
            process.exit(2);
        }

        pm2.start({
            name: 'ecommerce',
            script: 'app.js',
            watch: ['models', 'app.js', 'views'],
            // env: {
            //     'NODE_ENV': 'development'
            // }
        }, function(err) {
            console.log('pm2 started');
            pm2.streamLogs('all', 0);
        })
    })
})