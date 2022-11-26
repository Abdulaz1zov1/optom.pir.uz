const {Router} = require('express')
const router = Router()

const Product = require('../modeles/product')
const User    = require('../modeles/user')
const Sale    = require('../modeles/sales')
const Order   = require('../modeles/order')

const auth    = require('../middleware/auth')

router.get('/',auth,async(req,res)=>{
    let orders = []
    let report = {}
    if (req.session.user.role == 0){
        orders = await Order.find().populate('user').sort({_id:-1}).populate('products.product').lean()
        report = false
    } else {
        orders = await Order.find().populate('products.product').sort({_id:-1}).where({user: req.session.user._id}).lean()
        if (orders){
            report.forder = orders[0].date
            report.lorder = orders.at(-1).date
            report.allsumma = 0
            report.waitsumma = 0
            orders.forEach(order => {
                if (order.status == 2){
                    report.allsumma += order.price
                }
                if (order.status == 1 || order.status==0){
                    report.waitsumma += order.price
                }
            })
        }
    }
    orders = orders.map((order,index) => {
        order.index = index+1
        order.date = order.date.toLocaleString('en-GB')
        if (order.sale>0) {
            order.price -= order.sale
        }
        order.class = (order.status == 0) ? 'table-warning' : (order.status == 1) ? 'table-warning' : (order.status == 2) ? 'table-success' : 'table-danger'
        order.status = (order.status == 0) ? 'Не проверено' : (order.status == 1) ? 'В процессе' : (order.status == 2) ? 'Выполнено' : 'Отказано'
        return order
    })
    res.render('order/index',{
        title: 'Мои заказы',
        orders,
        report
    })
})

router.post('/sale',auth,async (req,res)=>{
    let {_id,sale} = req.body
    let order = await Order.findOne({_id})
    order.sale = sale
    await order.save()
    req.flash('success','Скидка добавлено!')
    res.redirect('/order')

})

router.get('/getbyid/:id',auth,async (req,res)=>{
    const _id = req.params.id
    const order = await Order.findOne({_id}).populate('user').sort({_id:-1}).populate('products.product').lean()
    res.send(order)
})

router.get('/check',auth,async (req,res)=>{
    if (req.session.user.role == 0){
        orders = await Order.find()
            .where({status:0})
            .populate('user')
            .sort({_id:-1})
            .lean()
        res.send(orders)
    }
})
router.get('/role',async(req,res)=>{
    res.send(JSON.stringify(req.session.user.role))
})

router.get('/changeby/:id/:index/:num',auth,async(req,res)=>{
    const _id = req.params.id
    const numCount = +req.params.num
    const index = +req.params.index
    // console.log(_id,index,num)
    let order = await Order.findOne({_id}).populate('products.product').lean()
    let summa = 0
    order.products[index].num = numCount
    order.products.forEach(product => {
        summa += product.num * product.price
    })

    order.price = summa
    await Order.findByIdAndUpdate(_id,order)
    res.send(JSON.stringify('OK'))
})
router.get('/status/:id/:status',auth,async(req,res)=>{
    const {id,status} = req.params
    let order = await Order.findOne({_id:id})
    if (order.status !== parseInt(status)){
        order.products.forEach(async product=>{
            let newProduct = await Product.findOne({_id:product.product})
            if (status == 2){
                newProduct.count -= product.num
            }
            if (status == 1 || status == 3){
                newProduct.count += product.num
            }


            await newProduct.save()

        })

    }
    order.status = +status
    await order.save()
    res.redirect('/order')
})

router.post('/',auth,async(req,res)=>{
    let {user,data,name,phone,address,sale} = req.body
    let order = JSON.parse(data)
    let products = []

    let price = 0
    order.forEach(item => {
        price += item.price*item.num
        products.push({
            product: item.id,
            num: item.num,
            price: item.price
        })
    })
    let date = new Date().toISOString()

    let newOrder = await new Order({
        user,
        products,
        sale,
        name,phone,address,
        price,
        date: new Date().toISOString(),
        status: 0
    })
    newOrder.save()
    res.redirect('/order')
})

router.get('/create',auth,async(req,res)=>{
    const user = req.session.user
    const sale = await Sale.find().where({user: user._id}).populate('product').lean()
    res.render('order/create',{
        title: 'Заказать товары',
        sale
    })
})
router.get('/delete/:id',auth,async (req,res)=>{
    const _id = req.params.id
    await Order.findByIdAndDelete({_id})
    res.redirect('/order')
})
router.get('/products',auth,async(req,res)=>{
    const user = req.session.user
    const sale = await Sale.find().where({user: user._id}).populate('product').lean()
    res.send(sale)
})
module.exports = router