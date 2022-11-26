const {Schema, model} = require('mongoose')

const category = new Schema({
    title: {
        type: String,
        required: true
    },
    status: {
        type: Number,
        default: 1,
    },

})


module.exports = model('Category',category)