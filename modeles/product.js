const {Schema, model} = require('mongoose')

const product = new Schema({
    title: {
        type: String,
        required: true
    },
    type: {
        type:String,
        default:''
    },
    color: {
        type:String,
        default:''
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: 'Category'
    },
    min: {
        type:Number,
        default:0,
    },
    photo: String,
    others:[String],
    pack: {
        type: Number,
        default: 0,
    },
    count: {
        type: Number,
        default: 0, 
    },
    status: {
        type: Number,
        default: 0,
    },
    price: Number,
    format: {
        type: String,
        default: '',
    },
    deadline: Date
})


module.exports = model('Product',product)