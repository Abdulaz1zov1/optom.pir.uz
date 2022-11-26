const {Schema, model} = require('mongoose')

const order = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    date: Date,
    price:Number,
    sale:Number,
    products: [
        {
            product: {
                type: Schema.Types.ObjectId,
                ref: 'Product'
            },
            num: Number,
            price: Number
        }
    ],
    status: {
        type: Number,
        default: 0,
    },
    address: String,
    name: String,
    phone: String,
    paystatus: Number,
    paytype: Number
})

module.exports = model('Order',order)