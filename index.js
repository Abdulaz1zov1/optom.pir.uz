const express = require('express') 
const exphbs = require('express-handlebars')
const mongoose = require('mongoose')
const session = require('express-session')
const csrf = require('csurf')
const bodyParser = require('body-parser')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const MongoStore = require('connect-mongodb-session')(session)
const flash = require('connect-flash') // !
const  xlsx = require('xlsx')
// const helmet = require('helmet')
// const compression = require('compression')
// Routerlar
const pageRouter = require('./router/page')
const usersRouter = require('./router/users')
const authRouter  = require('./router/auth')
const orderRouter = require('./router/order')
const adsRouter  = require('./router/ads')
const productRouter  = require('./router/product')
const categoryRouter = require('./router/category')
const settingsRouter = require('./router/settings')
const blogRouter = require('./router/blog')
const workerRouter = require('./router/worker')
const profileRouter = require('./router/profile')
const debtorRouter = require('./router/debtor')
const spendingRouter = require('./router/spending')
const reportRouter = require('./router/report')
// middleWare lar
const varMid = require('./middleware/var')
const fileMiddleware = require('./middleware/file')
const keys = require('./keys/dev')

const app = express()
const hbs = exphbs.create({
    defaultLayout: 'main',
    extname: 'hbs'
})
app.engine('hbs',hbs.engine)
app.set('view engine','hbs')
app.set('views','views')
app.use(express.urlencoded({extended:true})) 
app.use(express.static(__dirname+'/public')) 
app.use('/images',express.static('images')) // !

app.use(function (req, res, next) {

    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5002');

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers, X-CSRF-Token');
    // res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

const store = new MongoStore({
    collection: 'session',
    uri: keys.MONGODB_URI
})
app.use(session({
    secret: keys.SESSION_SECRET,
    saveUninitialized:false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 10,
        secure: false 
    },
    resave:true,
    store
}))

app.use(bodyParser.json());
app.use(cookieParser());
app.use(csrf())

app.use((error,req,res,next)=>{
    const message = `This is the unexpected field -> ${error.field}`
    console.log(message)
    next()
})

app.use(flash()) // !
app.use(varMid)
// app.use(helmet())
// app.use(compression())

app.use(pageRouter)
app.use('/users',usersRouter) 
app.use('/order',orderRouter)
app.use('/auth',authRouter) 
app.use('/settings',settingsRouter) 
app.use('/ads',adsRouter) 
app.use('/product',productRouter) 
app.use('/category',categoryRouter)
app.use('/blog',blogRouter)
app.use('/worker',workerRouter)
app.use('/debtor',debtorRouter)
// app.use('/genre',genreRouter)
app.use('/profile',profileRouter)
app.use('/report',reportRouter)
app.use('/spending',spendingRouter)

const PORT = process.env.PORT || 5002

async function dev(){
    try {
        await mongoose.connect(keys.MONGODB_URI,{useNewUrlParser:true})
        .then(()=>{console.log("database connected")})
        .catch((err)=>{console.log("err database")})
        app.listen(PORT,()=>{
            console.log(`Server is running ${PORT}`)
        })
    } catch (error) {
        console.log(error)
    }
}
dev()