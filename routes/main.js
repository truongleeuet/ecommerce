const router = require('express').Router();
const User = require('../models/user');
const Product = require('../models/product');
const Cart = require('../models/cart');
const stripe = require('stripe')('sk_test_PvsX9DqDoUYk7PUXlLpj3a88');

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
                foundCart: foundCart,
                message: req.flash('remove')
            })
        })
})
router.post('/product/:product_id', function(req, res, next) {
    Cart.findOne({ owner: req.user._id}, function(err, cart) {

        console.log(req.body.product_id, req.body.price, req.body.quantity)
        cart.items.push({
            item: req.body.product_id,
            price: parseFloat(req.body.priceValue),
            quantity: parseInt(req.body.quantity)
        });

        cart.total = (cart.total + parseFloat(req.body.priceValue)).toFixed(2);
        console.log(cart.total);
        cart.save(function(err) {
            if (err) return next(err);
            return res.redirect('/cart');
        })
    })
});


router.post('/remove', function(req, res, next) {
   Cart.findOne({ owner: req.user._id}, function(err, foundCart) {
       foundCart.items.pull(String(req.body.item));

       foundCart.total = (foundCart.total - parseFloat(req.body.price)).toFixed(2);
       foundCart.save(function(err, found) {
           if (err) return next(err);

           req.flash('remove', 'Successfully removed');
           res.redirect('/cart');
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


router.post('/payment', function(req, res, next) {
    var stripeToken = req.body.stripeToken;
    var currentCharges = Math.round(req.body.stripeMoney * 100)
    stripe.customers.create({
        source: stripeToken,
    }).then(function(customer) {
        return stripe.charges.create({
            amount: currentCharges,
            currecy: 'usd',
            customer: customer.id
        })
    })
})
module.exports = router;