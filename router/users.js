const {Router} = require('express')
const User = require('../modeles/user')
const Product = require('../modeles/product')
const Order = require('../modeles/order')
const Sales = require('../modeles/sales')

const bcrypt = require('bcryptjs')
const auth  = require('../middleware/auth')
const router = Router()

const csrf = require('csurf')
const csrfProtection = csrf({ cookie: true })

router.get('/',auth,async(req,res)=>{
    let users = await User.find()
        .where({$or:[{role:1},{role:2}]})
        .lean()
    users.map((user,index) => {
        user.index = index + 1
        user.role = user.role == 1 ? 'Надежный ритейлер' : 'Новый ритейлер'
        return user
    })
    res.render('users',{
        title: 'Пользователи',
        isUsers:true,
        users,
        error: req.flash('error'),
        success: req.flash('success')
    })
})
router.post('/sales',auth,async(req,res)=>{
    const {user,price,product} = req.body
    const sale = await new Sales({user,price,product})
    sale.save()
    req.flash('success','Успешно назначено цена')
    res.redirect(`/users/product/${user}`)
})
router.post('/editsales',auth,async(req,res)=>{
    const {user,price,product,_id} = req.body
    const sale = await Sales.findByIdAndUpdate(_id,{user,price,product})
    sale.save()
    req.flash('success','Успешно обновлено')
    res.redirect(`/users/product/${user}`)
})
router.get('/sales/delete/:id',auth,async(req,res)=>{
    const _id = req.params.id
    const sale = await Sales.findOne({_id})
    await Sales.findByIdAndRemove({_id})
    res.redirect('/users/product/'+sale.user)
})
router.get('/sales/edit/:id',auth,async(req,res)=>{
    if (req.params){
        const _id = req.params.id
        const sale = await Sales.findOne({_id}).lean()
        if (sale){
            res.send(sale)
        }
    }
})
router.get('/sales/:id',auth,async(req,res)=>{
    const _id = req.params.id
    let user = await User.findOne({_id}).lean()
    let sales = await Sales.find().where({user:_id}).lean()
    let productsId = []
    let products = []
    sales.forEach(sale => {
        productsId.push(sale.product)
    })
    if (productsId.length>0)
        products = await Product.find({_id: {$nin:productsId}}).lean()
    else
        products = await Product.find().lean()

    res.render('users/newsale',{
        title: `Назначение цены для ${user.name}`,
        user, products
    })
})


router.get('/create',auth,(req,res)=>{
    res.render('users/create',{
        title:'Новый пользователь',
        isUsers:true
    })
})

router.get('/product/:id',auth,async(req,res)=>{
    const _id = req.params.id
    const user = await User.findOne({_id}).lean()
    const sales = await Sales.find().populate('user').populate('product').where({user: _id}).lean()
    let productsId = []
    let products = []
    sales.forEach(sale => {
        productsId.push(sale.product)
    })
    if (productsId.length>0)
        products = await Product.find({_id: {$nin:productsId}}).lean()
    else
        products = await Product.find().lean()
    let allproducts =  await Product.find().lean()
    res.render('users/product',{
        title: `Продажа для ${user.name}`,
        user, sales, products, allproducts
    })
})

router.post('/save',auth,async(req,res)=>{
    const {_id,name,email,phone,password,role} = req.body
    let oldpass = await User.findOne({_id}).select('password').lean()
    console.log({_id,name,email,phone,password,role})
    let user = {}
    if (password.length>0){
        const hashPass = await bcrypt.hash(password, 10)
        user = {name,email,role,phone,password: hashPass}
    } else {
        user = {name,email,role,phone,password:oldpass['password']}
    }
    console.log(user)
    await User.findByIdAndUpdate(_id,user)
    req.flash('success', 'Успешно!')
    if (role == 1)
        res.redirect('/users/')
    else 
        res.redirect('/users/')
})
router.get('/edit/:id',auth,async(req,res)=>{
    const _id = req.params.id 
    const user = await User.findOne({_id}).lean()
    res.render('users/edit',{
        title: `Редактировать ${user.name}`,
        user,
        isUsers:true
    })
})
router.get('/delete/:id',auth,async(req,res)=>{
    const _id = req.params.id
    await User.findByIdAndRemove({_id})
    req.flash('success','Удалено')
    res.redirect('/users')
})
router.post('/', async (req, res) => {
    let {name,phone,password,role} = req.body
    const reallyMen = await User.findOne({phone})
    role = role || 1
    if (reallyMen) {
        req.flash('error', 'Пользователь с таким почтой или номер телефоном уже имеется!')
        res.redirect('/users/create')
    } else {
        const hashPass = await bcrypt.hash(password, 10)
        const really = await new User({name,role,phone,password: hashPass})
        await really.save()
        // await transporter.sendMail({
        //     from: keys.SYSTEM_EMAIL,
        //     to: email,
        //     subject: 'Ro`yhatdan o`tildi',
        //     html: `<h1>Hurmatli ${name}, siz tizimda ro'yhatdan o'tdingiz!</h1>`
        // });
        req.flash('success', 'Успешно!')
        if (role == 1)
            res.redirect('/users/')
        else 
            res.redirect('/users/')

    }
})
router.get('/api/getcsrftoken', function (req, res) {
    return res.json({ csrfToken: req.csrfToken() });
})
router.post('/login', async (req, res) => {
    const {email,password} = req.body
    const maybeUser = await User.findOne({email})
    if (maybeUser) {
        const comparePass = await bcrypt.compare(password, maybeUser.password)
        if (comparePass) {
            req.session.user = maybeUser
            req.session.isAuthed = true
            
            req.session.save((err) => {
                if (err) throw err
                else res.send(req.session)
            })
        } else {
            res.send('fucked error')
        }
    } else {
        res.send('email not exist in hell')
    }
})
router.post('/reg',async (req, res) => {
    try {
        const {email,phone,password} = req.body
        const reallyMen = await User.findOne({email})
        if (reallyMen) {
            console.log('11')
            res.send('user is exist!')
        } else {
            console.log('else')
            const hashPass = await bcrypt.hash(password, 10)
            const really = await new User({email,phone,password: hashPass,role:5})
            await really.save()
            console.log(really)
            res.send(really)
        }

    } catch (e) {
        res.send(e)
    }
})

router.get('/more/:id',auth,async(req,res)=>{
    if (req.params){
        let _id = req.params.id
        console.log(_id)
        let user = await User.findOne({_id}).lean()
        let report = {}
        let orders = await Order.find({user:_id}).populate('products.product').sort({_id:-1}).lean()
        if (orders.length>0){
            console.log(orders)
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
        }
        res.render('users/more',{
            title: 'Мои заказы',
            orders,
            report,
            user
        })
    }
})


module.exports = router