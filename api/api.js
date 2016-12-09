const router = require('express').Router();
const async = require('async');
const Promise = require('bluebird');
const mongoose = require('mongoose');
const faker = require('faker');
mongoose.Promise = require('bluebird');
const Category = require('../models/category');
const Product = require('../models/product');

router.post('/search', function(req, res, next) {

    console.log(req.body.search_term);
    Product.search({
        query_string: { query: req.body.search_term}
    }, function(err, results) {
        if (err) return next(err);

        res.json(results);
    })
});
router.get('/:name', (req, res, next) => {

    Category.findOne({ name: req.params.name}).exec().then(function(category) {
        for(var i = 0; i < 30; i++) {
            var product = new Product();
            product.category = category._id;
            product.name = faker.commerce.productName();
            product.price = faker.commerce.price();
            product.image = faker.image.image();
            product.save();
        }
    }).then(function() {
        res.json({ message: 'Success'});
    }).catch(function(err){
        return next(err)
    })
});

module.exports = router;