const {Router} = require('express')
const router = Router()
const auth = require('../middleware/auth')
// const auth = require('../middleware/auth')
const Debtor = require('../modeles/debtor')




router.get('/',auth,async(req,res)=>{
    let debtor = await Debtor.find().sort({_id:-1}).lean()
    let summaSum = 0;
    let summaDollar = 0;
    debtor = debtor.map((debt,index) => {
        if(debt.currency == 0) {
            summaSum +=debt.summa
        }

        if(debt.currency == 1) {
            summaDollar += debt.summa
        }
        debt.remain = debt.summa - debt.val
        if (debt.type == 1) {
                debt.class = 'table-success';
        } else if (debt.remain == 0 ) {
            debt.class = 'table-warning';
        } else {
            debt.class = 'table-danger';
        }
        debt.type = debt.type == 1 ? 'Наш долг' : 'Долг'
        debt.index = index + 1
        debt.summa = debt.summa.toLocaleString()
        debt.currency = debt.currency == 0 ? 'Sum' : '$'
        debt.createdAt = (debt.createdAt.getDate() + '/' + (debt.createdAt.getUTCMonth()+1) + '/' + debt.createdAt.getFullYear() + ' ' + debt.createdAt.getHours() + ':' + debt.createdAt.getMinutes() + ':' + debt.createdAt.getSeconds())
        debt.data = (debt.data.getDate() + '/' + (debt.data.getUTCMonth()+1) + '/' + debt.data.getFullYear())

        return debt
    })
    summaSum = summaSum.toLocaleString()
    summaDollar = summaDollar.toLocaleString()
    res.render('debtor/index',{
        debtor,
        summaSum,
        summaDollar,
        isDebtor:true,
        title: 'Список должники',
        error: req.flash('error'),
        success: req.flash('success')
    })
})

router.get('/get/:id',auth,async(req,res)=>{
    if (req.params.id){
        let deptor = await Debtor.findOne({_id:req.params.id}).lean()
        if (deptor) {
            res.send(deptor)
        } else {
            res.send('error')
        }
    }
})

router.get('/excell',auth,async(req,res)=>{
    let debtor = await Debtor.find().sort({_id:-1}).lean()
    let summaSum = 0;
    let summaDollar = 0;
    debtor = debtor.map((debt,index) => {
        if(debt.currency == 0) {
            summaSum +=debt.summa
        }
        if(debt.currency == 1) {
            summaDollar += debt.summa
        }
        debt.index = index + 1
        debt.summa = debt.summa.toLocaleString()
        debt.currency = debt.currency == 0 ? 'Sum' : '$'
        debt.createdAt = (debt.createdAt.getDate() + '/' + (debt.createdAt.getUTCMonth()+1) + '/' + debt.createdAt.getFullYear() + ' ' + debt.createdAt.getHours() + ':' + debt.createdAt.getMinutes() + ':' + debt.createdAt.getSeconds())
        debt.data = (debt.data.getDate() + '/' + (debt.data.getUTCMonth()+1) + '/' + debt.data.getFullYear())

        return debt
    })
    summaSum = summaSum.toLocaleString()
    summaDollar = summaDollar.toLocaleString()
    res.render('debtor/excell',{
        debtor,
        summaSum,
        summaDollar,
        isDebtor:true,
        title: 'Список должники',
        error: req.flash('error'),
        success: req.flash('success')
    })
})

router.get('/delete/:id',auth,async(req,res)=>{
    const _id = req.params.id
    await Debtor.findByIdAndDelete({_id})
    req.flash('success','удалено!')
    res.redirect('/debtor')
})



router.post('/',auth,async(req,res)=>{
    try {
        let {title,discription,currency,data,type,summa} = req.body
        const debtor = await new Debtor({title,discription,type,summa,currency,data,createdAt:Date.now()})
        await debtor.save()
        req.flash('success', 'добавлено!')
        res.redirect('/debtor/')
    } catch (error) {
        console.log(error)
    }
})

router.post('/save',auth,async(req,res)=>{
    let {data,val} = req.body
    let _id = req.body._id
    let debtor = await Debtor.findOne({_id})
    debtor.val += +val
    if (data){
        debtor.data = data
    }
    await debtor.save()
    req.flash('success','обновлено!')
    res.redirect('/debtor/')
})



module.exports = router