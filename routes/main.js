const router = require('express').Router();
const User = require('../models/user');
const Product = require('../models/product');


router.get('/', (req, res, next) => {
    res.render('main/home');
});

router.get('/about', (req, res, next) => {
    res.render('main/about');
});

router.get('/products/:id', (req, res, next) => {
    Product.find({ category: req.params.id})
        .populate('category')
        .exec(function(err, products) {
            if (err) return next(err);
            res.render('main/category', {
                products: products
            })
        })
});

router.get('/product/:id', (req, res, next) => {
    Product.findById({ _id: req.params.id}, function(err, product) {
        if (err) return next(err);
        res.render('main/product', {
            product: product
        })
    })
})

module.exports = router;