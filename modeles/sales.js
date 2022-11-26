const {Schema, model} = require('mongoose')

const sales = new Schema({
    product: {
        type: Schema.Types.ObjectId,
        ref: 'Product'
    },
    price: {
        type: Number,
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
})


module.exports = model('Sales',sales)