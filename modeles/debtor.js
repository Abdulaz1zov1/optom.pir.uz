const {Schema, model} = require('mongoose')

const debtor = new Schema({
    title: {
        type: String,
        required: true
    },
    discription: {
        type: String,
        
    },
    type:{
        type:Number,
        default: 0
    },
    summa: {
        type: Number,
        required: true
    },
    val:{
        type: Number,
        default: 0
    },
    data: Date,
    createdAt: Date,
    currency: {
        type: String,
        default: 0
    }
})


module.exports = model('Debtor',debtor)