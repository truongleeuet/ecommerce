const Cart = require('../models/cart');

module.exports = function(req, res, next) {
    if (req.user) {
        var total = 0;
        Cart.findOne({ owner: req.user._id}, function(err, cart) {
            if (err) return next(err);
            if (cart) {
                for (var i = 0, len = cart.items.length; i < len; i++) {
                    total += cart.items[i].quantity;
                }

                res.locals.cart = total;
            } else {
                res.locals.cart = 0;
                next();
            }

            next();

        })
    } else {
        next();
    }
}