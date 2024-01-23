const express = require('express')
const sqlite3 = require('sqlite3')
const app = express()
const port = 3000

app.set('view engine' , 'ejs')
app.use(express.static('public'))


//middileware
app.use(express.urlencoded({extended:true}))


//db config
const db = new sqlite3.Database('./DB/moviedb.db')

//Authentication functionalities
app.post('/register' , (req,res) => {
    const {name,age,email,password} = req.body
    console.log(name,age,email,password)

    db.run(
        'INSERT INTO auth (name,age,email,password) VALUES (?,?,?,?)',
        [name,age,password,email],
        (err)=>{
            if(err){
            return res.render('register',{error:'Registration Failed.Email is already Exist'})
        }
        res.redirect('/login')
    }
    )
})


app.get('/',(req,res)=>{
    res.render('index', {message:'hello'})
})


app.listen(port,()=>{
    console.log('server is running at http://localhost:3000')
})