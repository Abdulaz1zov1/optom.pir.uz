const {Router} = require('express')
const router = Router() 
const auth = require('../middleware/auth')
const Category = require('../modeles/category')
const csrf = require('csurf')
const csrfProtection = csrf({ cookie: true }) 
const Blog = require('../modeles/blog')
const Order = require('../modeles/order')
const Page = require('../modeles/page')
const Product = require('../modeles/product')
const User = require('../modeles/user')

router.get('/', auth,async(req,res)=>{
    if (req.session.user.role !== 0){
        res.redirect('/product')
    }
    const products = await Product.find().lean()
    const users = await User.find()
        .where({$or:[{role:1},{role:2}]})
        .lean()
    let pack = 0
    let allsumma = 0
    let waitOrder = await Order.find({$or:[{status:0},{status:1}]}).select('_id').lean()
    let successOrder = await Order.find({status:2}).select('_id').lean()
    products.forEach(product => {
        pack+= product.count
        allsumma += product.count * product.price
    })
    let orders = await Order.find().populate('user').sort({_id:-1}).limit(7).populate('products.product').lean()
    orders = orders.map(order => {
        order.date = order.date.toLocaleString('en-GB')
        order.status = (order.status == 0) ? 'Не проверено' : (order.status == 1) ? 'В процессе' : (order.status == 2) ? 'Выполнено' : 'Отказано'
        return order
    })
    res.render('index',{
        title: 'Главная страница',
        products, users, pack,  waitOrder, successOrder, orders,
        isHome:true, allsumma
    })
})
router.get('/api/getcsrftoken', csrfProtection, function (req, res) {
    return res.json({ csrfToken: req.csrfToken() });
})

router.get('/allorders',auth,async (req,res)=>{
    let orders = await Order.find({status:2}).populate('products.product').lean()
    res.send(orders)
})

router.get('/search',auth,async(req,res)=>{
    const {search} = req.query

    const products = await Product.find()
        .where({title: { $regex: '.*' + search.toLowerCase() + '.*' } })
        .select(['_id','title','price','sale','pimg'])
        .lean()

    res.send(products)
})



router.get('/page/all',auth,async(req,res)=>{
    const page = await Page.find().lean()
    res.render('page/index',{
        title: 'Sahifalar ro`yhati',
        page,
        isPage:true,
        error: req.flash('error'),
        success: req.flash('success')
    })
})

router.get('/page/show/:id',auth,async(req,res)=>{
    const _id = req.params.id
    const page = await Page.findOne({_id}).lean()
    res.render('page/view',{
        title: `${page.title}`,
        page,
        isPage:true,
    })
})

router.get('/page/create',auth,(req,res)=>{
    res.render('page/create',{
        title: 'Yangi sahifa'
    })
})

router.get('/page/edit/:id',auth,async(req,res)=>{
    const _id = req.params.id
    const page = await Page.findOne({_id}).lean()
    res.render('page/edit',{
        page,
        isPage:true,
        error: req.flash('error'),
        success: req.flash('success'),
        title: `${page.title} ni tahrirlash`
    })
})

router.get('/page/get/:menu',async(req,res)=>{
    const menu = req.params.menu 
    const pages = await Page.find().where({'menu':menu,'status':0}).select(['_id','title','slug']).lean()
    res.send(pages)
})

router.post('/page/',auth,async(req,res)=>{
    const {title,slug,status,text,menu} = req.body
    
    if (status == undefined) status = 1
    const haveblog = await Page.findOne({slug})
    if (haveblog){
        req.flash('error','Bunday sahifa bor!')
        res.redirect('/page/all')
    } else {
        const page = await new Page({title,slug,status,menu,text})
        await page.save()
        req.flash('success','Yangi sahifani ro`yhatdan o`tkazildi')
        res.redirect('/page/all')
    }
})


router.post('/page/save',auth,async(req,res)=>{
    let {_id,title,slug,status,text} = req.body
    // console.log(typeof status)
    // let img = 'no-image'
    if (req.file){  
        img = req.file.path
    }
    if (status == undefined) status = 1
    const haveblog = await Page.findOne({slug,_id: {$ne:_id}})
    if (haveblog){
        req.flash('error','Bunday page bor!')
        res.redirect(`/page/edit/${_id}`)
    } else {
        const page = await Page.findByIdAndUpdate(_id,{title,slug,status,text,img})

        await page.save()
        req.flash('success','Blog muvaffaqiyatli o`zgardi')
        res.redirect('/page/all')
    }
})

router.get('/page/change/:id/:status',auth,async(req,res)=>{
    const _id = req.params.id
    let status = req.params.status
    status = (parseInt(status)==0)?1:0
    let page = await Page.findByIdAndUpdate(_id,{status})
    page.save()
    res.redirect('/page/all')
})

// router.get('/order/',async(req,res)=>{
//     const products =await JSON.parse(req.query.products)
//     const order = await new Order({products})
//     await order.save()
//     res.send('OK')
// })

router.get('/page/delete/:id',auth,async(req,res)=>{
    await Page.findByIdAndDelete(req.params.id)
    res.redirect('/page/all')
})


router.get('/page/:slug',async(req,res)=>{
    const slug = req.params.slug
    const page = await Page.findOne({slug}).lean()
    res.send(page)
})



module.exports = router