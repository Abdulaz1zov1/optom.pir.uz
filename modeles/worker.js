const {Schema, model} = require('mongoose')
const worker = new Schema({
    name: String,
    lname: String,
    phone: String,
    phone_res: String,
    lvl: String,
    salary: Number,
    current:{
        type: Number,
        default: 0,
    },
    history: [
        {
            type:{
                type:Number,
                default:0
            },
            date:Date,
            getsalary:Number,
            createdAt:Date,
        }
    ]

})
module.exports = model('Worker',worker)