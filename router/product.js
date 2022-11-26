const {Router} = require('express')
const router = Router()
const Product = require('../modeles/product')
const Category = require('../modeles/category')
const auth = require('../middleware/auth')
const upload = require('../middleware/file')
const Sale = require('../modeles/sales')
const User = require('../modeles/user')

router.get('/',auth,async(req,res)=>{
    let products = []
    const category = await Category.find().where({status:1}).lean()
    const btns = (req.session.user.role == 0)?true:false

    let checkUser = await User.findOne({_id:req.session.user._id}).lean()
    if (checkUser){
        req.session.user.role = checkUser.role
        // req.session.save((err) => {
        //     if (err) throw err
        //     else res.redirect('/')
        // })
    }

    if (req.session.user.role == 0 || req.session.user.role == 2){
    products = await Product.find().populate('category').lean()
    products = products.map(product => {
        product.alert = product.num<product.min ? 'danger' : ''
        product.color = (product.color == 0) ? 'Цветной' : 'Ч/б'
        product.type = (product.type == 0) ? 'Твердая' : 'Мягкий'
        product.format = (product.format == 0) ? 'Другое' : 'А'+product.format
        product.typecount = (product.typecount == 0) ? 'Штук' : 'Пачка'
        product.balance = product.count%product.pack
        product.num = Math.floor(product.count/product.pack)
        return product
    })
} else {
    let sales = await Sale.find().where({user:req.session.user._id}).populate('product').lean()
    sales.forEach(sale => {
        sale.product.price = sale.price
        products.push(sale.product)
    })
    products = products.map(product => {
        product.alert = product.count==0 ? 'danger' : ''
        product.color = (product.color == 0) ? 'Цветной' : 'Ч/б'
        product.type = (product.type == 0) ? 'Твердая' : 'Мягкий'
        product.format = (product.format == 0) ? 'Другое' : 'А'+product.format
        product.typecount = (product.typecount == 0) ? 'Штук' : 'Пачка'
        product.balance = product.count%product.pack
        product.num = Math.floor(product.count/product.pack)
        return product
    })
    // console.log(products)
}
    // console.log(products)
    res.render('product/index',{
        title: 'Список товаров',
        btns,
        isProduct:true,
        products,
        category,
        error: req.flash('error'),
        success: req.flash('success')
    })
})

router.get('/create',auth,async(req,res)=>{
    const category = await Category.find().lean()
    res.render('product/new',{
        title: 'Добавить нового товара',
        isProduct:true,
        category
    })
})



router.get('/delete/:id',auth,async(req,res)=>{
    const _id = req.params.id
    await Sale.deleteMany({product:_id})
    await Product.findByIdAndDelete({_id})
    res.redirect('/product/')
})

router.post('/', upload.fields([{name:'photo',maxCount:1},{name:'others',maxCount:10}]),async(req,res)=>{
    try {
        let photo= ''
        let others = []
        console.log(req.files)
        if (req.files){
            let fileinfo = req.files
            if (fileinfo.photo){
                photo = fileinfo.photo[0].path
            }
            if (fileinfo.others){
                fileinfo.others.forEach(file => {
                    others.push(file.path)
                })
            }
        }

        const {title, format,  category, color, min, price, type, pack, count} = req.body
        const product = await new Product({title,category, price, color, min, type, pack, count, photo, format, others })
        product.save()
        req.flash('success','Товар добавлено!')
        res.redirect('/product')
    } catch (error) {
        console.log(error)
    }
})

router.post('/save',upload.fields([{name:'photo',maxCount:1},{name:'others',maxCount:10}]),async(req,res)=>{
    let {title,category, price, color, type, pack, count, min,  format } = req.body
    let _id = req.body._id
    let product = {title,category, price, color, type, pack, min, count,  format }

    let others = []
    console.log(req.files)
    if (req.files){
        let fileinfo = req.files
        if (fileinfo.photo){
            product.photo = fileinfo.photo[0].path
        }
        if (fileinfo.others){
            fileinfo.others.forEach(file => {
                others.push(file.path)
            })
            product.others = others
        }
    }
    await Product.findByIdAndUpdate({_id},product)
    req.flash('sucess','Товар обновлено!')
    res.redirect('/product')
})

router.get('/edit/:id',auth,async(req,res)=>{
    const _id = req.params.id
    const category = await Category.find().lean()
    const product = await Product.findOne({_id}).populate('category').lean()
    res.render('product/edit',{
        title: `Редактировать: ${product.title}`,
        product, category, _id,
        isProduct:true,
    })
})

router.get('/show/:id',auth,async(req,res)=>{
    const _id = req.params.id
    const product = await Product.findOne({_id}).populate('category').lean()
    product.newPrice = product.price*(100-product.sale)/100
    res.render('product/view',{
        title: `${product.category.name} | ${product.title} | ${product.price} so'm`,
        product,
        isProduct:true,
    })
})
router.get('/view/:id',async(req,res)=>{
    const _id = req.params.id
    let product = await Product.findOne({_id}).populate('category').lean()
    res.send(product)
})

router.get('/newproduct',async(req,res)=>{
    const products = await Product.find().populate('category').where({'isnew':0}).select(['category','title','price','sale','pimg']).lean().limit(4).sort({_id:-1})
    res.send(products)
})



router.get('/info/:id',async(req,res)=>{
    const _id = req.params.id
    const product = await Product.findOne({_id})
    res.send(product)

    // product.warranty -> product['warranty']
})

router.get('/sliderproducts',async(req,res)=>{
    const products = await Product.find()
        .where({'slider':1})
        .select(['_id','pimg','title','price','sale'])
        .limit(5)
        .sort({_id:-1}).lean()
    res.send(products)
})

// api
router.get('/api/all/',async(req,res)=>{
    let products = await Product.find().populate('category')

    if (req.session.user.role == 0 || req.session.user.role == 2){
        products = await Product.find().populate('category').lean()
        products = products.map(product => {
            product.color = (product.color == 0) ? 'Цветной' : 'Ч/б'
            product.type = (product.type == 0) ? 'Твердая' : 'Мягкий'
            product.format = (product.format == 0) ? 'Другое' : 'А'+product.format
            product.typecount = (product.typecount == 0) ? 'Штук' : 'Пачка'
            product.balance = product.count%product.pack
            product.num = Math.floor(product.count/product.pack)
            return product
        })
    } else {
        let sales = await Sale.find().where({user:req.session.user._id}).populate('product').lean()
        products = sales.map(sale => {
            sale.color = (sale.product.color == 0) ? 'Цветной' : 'Черно-белый'
            sale.type = (sale.product.type == 0) ? 'Твердая' : 'Мягкий'
            sale.format = (sale.product.format == 0) ? 'Другое' : 'А'+sale.product.format
            sale.product.typecount = (sale.product.typecount == 0) ? 'Штук' : 'Пачка'
            sale.balance = sale.product.count%sale.product.pack
            sale.num = Math.floor(sale.product.count/sale.product.pack)
            sale.photo = sale.product.photo
            sale.count = sale.product.count
            sale.pack = sale.product.pack
            sale.category = sale.product.category
            sale.title = sale.product.title
            // sale.product.push(sale.product)
            return sale
        })
        // console.log(products)
    }

    // products.map(product => {
    //     product.color = (product.color == 0) ? 'Цветной' : 'Ч/б'
    //     product.type = (product.type == 0) ? 'Твердая' : 'Мягкий'
    //     product.format = (product.format == 0) ? 'Другое' : 'А'+product.format
    //     product.typecount = (product.typecount == 0) ? 'Штук' : 'Пачка'
    //     product.balance = product.count%product.pack
    //     product.num = Math.floor(product.count/product.pack)
    //     product.btns = (req.session.user.role ==0) ?true:false
    //     return product
    // })
    res.send(products)
})
router.get('/api/search/',async (req,res)=>{
    let {title,color,format,type,category} = req.query
    title = title || ''
    color = color || ''
    type = type || ''
    format = format || ''
    let products = []
    if (category){
        products = await Product.find({
            $and: [
                {'title': {$regex: new RegExp( title.toLowerCase(), 'i')}},
                {'category': category},
                {'color': {$regex: color}},
                {'type': {$regex: type}},
                {'format': {$regex: format}},
            ]
        }).populate('category')
    } else {
        products = await Product.find({
            $and: [
                {'title': {$regex: new RegExp( title.toLowerCase(), 'i')}},
                {'color': {$regex: color}},
                {'type': {$regex: type}},
                {'format': {$regex: format}},
            ]
        }).populate('category')
    }

    products.map(product => {
        product.color = (product.color == 0) ? 'Цветной' : 'Ч/б'
        product.type = (product.type == 0) ? 'Твердая' : 'Мягкий'
        product.format = (product.format == 0) ? 'Другое' : 'А'+product.format
        product.typecount = (product.typecount == 0) ? 'Штук' : 'Пачка'
        product.balance = product.count%product.pack
        return product
    })

    res.send(products)


})

module.exports = router