const {Schema, model} = require('mongoose')
const user = new Schema({
    name: String,
    password: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required:true,
        unique: true,
    },
    role: {
        type: Number,
        default: 1,
        // 0 -> admin
        // 1 -> sale
        // 2 -> newsale
        // 2 -> off
        
    },
    logAt:[Date],
    resetToken: String,
    resetTokenExp: Date,
    img: String,
})
module.exports = model('User',user)