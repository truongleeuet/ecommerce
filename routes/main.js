const router = require('express').Router();

router.get('/', (req, res, next) => {
    res.render('main/home');
});
router.get('/about', (req, res, next) => {
    res.render('main/about');
});

module.exports = router;