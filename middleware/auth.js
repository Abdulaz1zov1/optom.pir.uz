module.exports = (req,res,next)=>{
    if (!req.session.isAuthed){
        return res.redirect('/auth/login')
    }
    if (req.session.user.role == 0){
        res.locals.control = true
    } else {
        res.locals.control = false
    }
    // if(req.session.user.role !==0) {
    //     return res.redirect('/auth/login')
    // }
    next()
}