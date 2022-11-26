const {Router} = require('express')
const router = Router()
const Users = require('../modeles/user')
const Orders = require('../modeles/order')
const Products = require('../modeles/product')
const superauth  = require('../middleware/superauth')

router.get('/',superauth,async(req,res)=>{
    let users = await Users.find({$or:[{role:1},{role:2}]}).lean()
    users = await Promise.all(
        users.map(async (user,index)=>{
            user.index = index + 1
            user.role = user.role == 1 ? 'Надежный ритейлер' : 'Новый ритейлер'
            let orders = await Orders.find({user:user._id}).lean()
            user.orderCount = orders.length
            user.orderSumma = 0
            user.orderNum   = 0
            orders.forEach(order => {
                user.orderSumma += order.price
                order.products.forEach(item => {
                    user.orderNum += item.num
                })
            })

            return user
        })
    )

    res.render('report',{
        title:'Отчёты', users,
        control:true, isReport:true
    })
})

module.exports = router