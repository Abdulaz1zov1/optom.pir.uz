const {Router} = require('express')
const router = Router()
const Category = require('../modeles/category')
const auth = require('../middleware/auth')
const Product = require('../modeles/product')
const { route } = require('./page')

router.get('/',auth,async(req,res)=>{
    let category = await Category.find().lean()
    category.forEach((cat,index) => {
        cat.index = index + 1
        cat.statusClass = cat.status == 1 ? 'bg-success': 'bg-danger'
        cat.status = (cat.status == 1) ? 'Активный' : 'Отключенный'
        return cat
    })
    res.render('category/index',{
        title: 'Список категории',
        category,
        isCategory:true,
        error: req.flash('error'),
        success: req.flash('success')
    })
})

router.get('/create',auth,(req,res)=>{
    res.render('category/create',{
        title: 'Новая категория',
        isCategory:true,
    })
})

router.get('/edit/:id',auth,async(req,res)=>{
    const _id = req.params.id
    const category = await Category.findOne({_id}).lean()
    res.render('category/edit',{
        category,
        isCategory:true,
        error: req.flash('error'),
        success: req.flash('success'),
        title: `редактировать: ${category.title}`
    })
})

router.post('/save',auth,async(req,res)=>{
    let {_id,title,status} = req.body
    if (parseInt(status) !== 1) status = 0
    const category = await Category.findByIdAndUpdate(_id,{title,status})
    await category.save()
    req.flash('success','Добавлено')
    res.redirect('/category')

})



router.get('/change/:id/:status',auth,async(req,res)=>{
    const _id = req.params.id
    let status = req.params.status
    status = (parseInt(status)==0)?1:0
    let category = await Category.findByIdAndUpdate(_id,{status})
    category.save()
    res.redirect('/category')
})

router.get('/delete/:id',auth,async(req,res)=>{
    await Category.findByIdAndDelete(req.params.id)
    res.redirect('/category')
})

router.post('/',auth,async(req,res)=>{
    let {title,status} = req.body
    status = status || 0
    const category = await new Category({title,status})
        await category.save()
        req.flash('success','Добавлено')
        res.redirect('/category')
})

// API

router.get('/all',async(req,res)=>{
    const categories = await Category.find().where({'status':1}).lean()
    // console.log(categories)
    res.send(categories)
})

router.get('/api/allcategory',async(req,res)=>{
    let category = await Category.find()
    res.send(category)
})

router.get('/api/:id',async(req,res)=>{
    const _id = req.params.id
    // console.log(slug)
    const category = await Category.findOne({_id}).lean()
    // console.log(category)
    // const ads = await Ads.find().where({'categoryId':category._id,'status':1}).sort({_id:-1}).lean()
    res.send(category)
})

module.exports = router