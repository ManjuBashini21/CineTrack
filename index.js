const express = require('express')
const sqlite3 = require('sqlite3')
const bodyParser = require('body-parser');
const multer = require('multer'); 
const path = require('path');


const app = express()
const port = 3000

app.set('view engine' , 'ejs')
app.use(express.static('public'))


// Configure Multer for handling file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'public/images'); 
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname));
    },
});
const upload = multer({ storage: storage });



//middileware
app.use(express.urlencoded({extended:true}))
app.use(bodyParser.urlencoded({ extended: true }));


//db config
const db = new sqlite3.Database('./db/moviedb.db')
const db1 = new sqlite3.Database('./db/catalog.db')



//login and register route 

app.get('/login',(req,res)=>{
  res.render('login')
})

app.get('/register',(req,res)=>{
  res.render('register')
})


// Authendication functionalities
app.post('/register',(req,res)=>{
    const {name,age,email,password} = req.body

    console.log(name,age,email,password)

    db.run(
        'INSERT INTO moviedb (name,age,email,password) VALUES (?,?,?,?)',
        [name,age,email,password],
        (err)=>{
            console.log(err)
            if(err){
                return res.render('register',{error:'Registration Failed. Email may already be in use.'})
            }
            res.redirect('/')
        }
    )
})

app.post('/login',(req,res)=>{
    const {email,password} = req.body
    console.log(email,password)
    

    db.get('SELECT * FROM moviedb WHERE email = ? AND password = ?',
        [email,password],
        (err,user)=>{
            if(err || !user){
                return res.render('login',{error: 'Invalid email or password.'})
            }
            res.redirect('/')
        }
    )
})


//CREATE
app.post('/submit-movie', upload.single('image'), (req, res) => {
    const { title, director, releaseYear, genre, description } = req.body;
    const image = req.file ? `/images/${req.file.filename}` : null; 
  
    db1.run(
      'INSERT INTO catalog (title, director, releaseYear, genre, description, image) VALUES (?, ?, ?, ?, ?, ?)',
      [title, director, releaseYear, genre, description, image],
      (err) => {
        if (err) {
          console.error(err);
          return res.redirect('form' , {error:'Submission failed'});
        }else{
          res.redirect('/');

        }
      }
    );
});




//index route
app.get('/', (req, res) => {
    db1.all('SELECT * FROM catalog', (err, catalog) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Internal Server Error');
      }
      console.log('Catalog:', catalog);
      res.render('index', { catalog });
    });
});

  



//READ
app.get('/readmore/:id', (req, res) => {
  const movieId = req.params.id;

  db1.get('SELECT * FROM catalog WHERE id = ?', [movieId], (err, movie) => {
      if (err || !movie) {
          console.error(err);
          return res.status(500).send('Internal Server Error');
      }

      res.render('readmore', { movie });
  });
});



app.get('/form',(req,res)=>{
    res.render('form')
})




//DELETE
app.get('/delete/:id', (req, res) => {
  const movieId = req.params.id;

  
  db1.run('DELETE FROM catalog WHERE id = ?', [movieId], (err) => {
    if (err) {
      console.error(err);
      return res.redirect('/readmore?error=Deletion failed');
    }
    res.redirect('/');
  });
});



//UPDATE
app.get('/update/:id', (req, res) => {
  const movieId = req.params.id;
  
  db1.get('SELECT * FROM catalog WHERE id = ?', [movieId], (err, movie) => {
    if (err || !movie) {
      return res.status(404).send('Movie not found');
    }
    res.render('update', { movie, error: req.query.error }); // Pass error as a query parameter
  });
});



app.post('/update/:id', upload.single('image'),  (req, res) => {
  const movieId = req.params.id;
  const { title, director, releaseYear, genre, description} = req.body;
  const image = req.file ? `/images/${req.file.filename}` : null; 
  console.log(req.body)
  console.log(req.file)
  console.log(movieId)


  db1.run(
    'UPDATE catalog SET title = ?, director = ?, releaseYear = ?, genre = ?, description = ?, image = ? WHERE id = ?',
    [title, director, releaseYear, genre, description, image, movieId],
    (err) => {
      if (err) {
        console.error(err);
        return res.redirect(`/update/${movieId}?error=Update failed`);
      }
      res.redirect('/');
    }
  );
});


//SEARCH
app.get('/search', (req, res) => {
  const query = req.query.q; // Assuming 'q' is the query parameter
  
  db1.all('SELECT * FROM catalog WHERE title LIKE ?', [`%${query}%`], (err, searchResults) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Internal Server Error');
    }
    res.render('search', { searchResults, query });
  });
});




//FILTER
app.get('/filter', (req, res) => {
  const { title, genre, releaseYear, director } = req.query;
  const filterConditions = [];
  const filterValues = [];

  if (title) {
    filterConditions.push('title LIKE ?');
    filterValues.push(`%${title}%`);
  }
  if (genre) {
    filterConditions.push('genre LIKE ?');
    filterValues.push(`%${genre}%`);
  }
  if (releaseYear) {
    filterConditions.push('releaseYear = ?');
    filterValues.push(releaseYear);
  }
  if (director) {
    filterConditions.push('director LIKE ?');
    filterValues.push(`%${director}%`);
  }

  const filterQuery = filterConditions.length > 0 ? `WHERE ${filterConditions.join(' AND ')}` : '';

  
  db1.all(`SELECT * FROM catalog ${filterQuery}`, filterValues, (err, filterResults) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Internal Server Error');
    }
    res.render('filter', { filterResults, title, genre, releaseYear, director });
  });
});









app.listen(port,()=>{
    console.log('server is running at http://localhost:3000')
})