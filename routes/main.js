const router = require('express').Router();
const User = require('../models/user');
const Product = require('../models/product');


function paginate(req, res, next) {
    var perPage= 9;
    var page = req.params.page || 1;

    Product.find()
        .skip(perPage * (page - 1))
        .limit(perPage)
        .populate('category')
        .exec(function(err, products) {
            if (err) return next(err);

            Product.count().exec(function(err, count) {
                if (err) return next(err);

                res.render('main/product-main', {
                    products: products,
                    pages: count / perPage
                })
            })
        })
}
Product.createMapping(function(err, mapping) {
    if (err) {
        console.log('error creating mapping');
        console.log(err);
    } else {
        console.log('Mapping created');
        console.log(mapping);
    }
});

var stream = Product.synchronize();
var count = 0;

stream.on('data', function() {
    count++;
});

stream.on('close', function() {
    console.log('Indexed ' + count + ' documents');
});

stream.on('error', function(err) {
    console.log(err);
});
router.get('/cart', (req, res, next) => {
    Cart.findOne({ owner: req.user._id})
        .populate('items.item')
        .exec(function(err, foundCart) {
            res.render('main/cart', {
                cart: foundCart
            })
        })
})
router.post('/product/:product_id', function(req, res, next) {
    Cart.findOne({ owner: req.user._id}, function(err, cart) {
        cart.items.push({
            item: res.body.product_id,
            price: parseFloat(req.body.price),
            quantity: parseInt(req.body.quantity)
        });

        cart.total = (cart.total + parseFloat(req.body.priceValue)).toFixed(2);

        cart.save(function(err) {
            if (err) return next(err);
            return res.redirect('/cart');
        })
    })
});

router.post('/search', function(req, res, next) {
    console.log(req.body.q);
    res.redirect('/search?q=' + req.body.q);
})
router.get('/search', (req, res, next) => {
    console.log(req.query.q);
    if (req.query.q) {
        Product.search({
            query_string: {
                query: req.query.q
            }
        }, function(err, results) {
            if (err) return next(err);
            var data = results.hits.hits.map(function(hit) {
                return hit;
            });

            res.render('main/search-result', {
                query: req.body.q,
                data: data
            });
        })
    }
})

router.get('/', (req, res, next) => {
    if (req.user) {
        paginate(req, res, next);
    } else {
        res.render('main/home');
    }
});


router.get('/page/:page', (req, res, next) => {
    paginate(req, res, next);
})
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