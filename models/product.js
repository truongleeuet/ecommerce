const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProductSchema = new Schema({
    category: { type: Schema.Types.ObjectId, ref: 'Category'},
    name: String,
    price: Number,
    image: String
});

module.exports = mongoose.model('Product', ProductSchema)