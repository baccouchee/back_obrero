  
const mysql = require('mysql');
const express = require('express');
var app = express();
var multer, path, crypto, storage;
multer = require('multer');
crypto = require('crypto');
var moment = require('moment');
const bodyparser = require('body-parser');
var CryptoJS = require("crypto-js");
var AES = require("crypto-js/aes");
console.log(CryptoJS.HmacSHA1("Message", "Key"));

path = require('path');
app.use(bodyparser.json());



var mysqlConnection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'obrero',
    multipleStatements: true
});

mysqlConnection.connect((err) => {
    if (!err)
        console.log('DB connection succeded.');
    else
        console.log('DB connection failed \n Error : ' + JSON.stringify(err, undefined, 2));
});


app.listen(3000, () => console.log('Express server is runnig at port no : 3000'));




//Get all login


//login
app.post('/login',(req,res) =>{

    var username= req.body.username;
    var password = req.body.password;
    
    mysqlConnection.query('SELECT * FROM user WHERE username = ?',[username], async function (error, results, fields) {
      if (error) {
        res.status(400).send({
          "code":400,
          "message":"error ocurred"
        })
        
      }else{
        if(results.length >0){
          const passphrase = '123';
          const bytes = CryptoJS.AES.decrypt(results[0].password, passphrase);
          const originalText = bytes.toString(CryptoJS.enc.Utf8);
            
            
          if(password === originalText){
              res.status(200).send({
                "message":"login successfull",
                "username":results[0].username,
                "id":results[0].id
              })
          }
          else{
            res.status(404).send({
                "message":"username and password does not match",
                "code":404
              })
        
          }
        }
        else{
          res.status(206).send({
            "code":206,
            "message":"username does not exits"
            
              });
        }
      }
      });
  });

  
//Get an user
app.get('/user/:id', (req, res) => {
    mysqlConnection.query('SELECT * FROM user WHERE id = ?', [req.params.id], (err, rows, fields) => {
        if (!err)
            res.status(200).send(rows);
        else
            res.status(404).log(err);
    })
});






//Insert a new User (Partial)
app.post('/signup', (req, res) => {
    let us = req.body;
    const passphrase = '123';
    let EPS = CryptoJS.AES.encrypt(us.password ,passphrase ).toString();
    var sql = "INSERT INTO `user`(`email`, `password`, `username`, `role`, `etat`, `firstname`, `lastname`) VALUES (?, ?, ?, 0, 0, ?, ?)";
    mysqlConnection.query(sql,[ us.email, EPS,us.username,us.firstname,us.lastname], (err, rows, fields) => {
        if (!err)
           
            res.status(200).send("Inserted User: "+rows.insertId);
        else
            res.status(404).log(err);
    })
});


// upadte phone
app.post('/phone/:id', (req, res) => {
    let us = req.body;
    var sql = "UPDATE `user` set `phone`=? WHERE `id` = ? ";
    mysqlConnection.query(sql,[us.phone, req.params.id], (err, rows, fields) => {
        if (!err)
            res.send('Update successfully.');
        else
            res.log(err);
    })
});




// devenir Pro
app.post('/getpro/:id', (req, res) => {
    let us = req.body;
    var sql = "UPDATE `user` set `role`=1, `etat`=1 WHERE `id` =? ";

    mysqlConnection.query(sql,[req.params.id], (err, rows, fields) => {
        if(!err) 
            res.status(200).send("Get Pro successfully: "+rows.insertId);
        else
            res.status(404).log("err");
    })

});


const storage1 = multer.diskStorage({
    destination: './upload',
    filename: (req,file,cb) => {
      return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
    }
  })
  
  const upload = multer({
    storage: storage1,
    limits: {
      fileSize: 1000000
    }
  })
 


  var fs = require('fs');

  storage = multer.diskStorage({
    destination: './uploads',
    filename: function(req, file, cb) {
      return crypto.pseudoRandomBytes(16, function(err, raw) {
        if (err) {
          return cb(err);
        }
        return cb(null, "" + (raw.toString('hex')) + (path.extname(file.originalname)));
      });
    }
  });


// Post files
app.post(
  "/upload",
  multer({
    storage: storage
  }).single('upload'), function(req, res) {
    console.log(req.file);
    console.log(req.body);
    res.redirect("/uploads" + req.file.filename);
    console.log(req.file.filename);
    return res.status(200).end();
  });

   
//Show image
app.use('/img', express.static('upload'))


//Insert a new Categorie (Partial)




//Insert a new Prestation (getPro)
app.post('/prestation/:id',upload.single('img'), (req, res) => {
    let us = req.body;
    var sql = "INSERT INTO `prestation` (`nom`, `description`, `tarif`, `idU`, `photo`, `idC`) VALUES (?, ?, ?, ?, ?, ?)";
    mysqlConnection.query(sql,[ us.nom, us.description, us.tarif, req.params.id, req.file.filename, us.idC], (err, rows, fields) => {
        if (!err)
            res.status(200).send('prestation.');
        else
            res.status(404).log(err);
    })
});




//Get all Categories
app.get('/Categories', (req, res) => {
    mysqlConnection.query('SELECT * FROM Categorie', (err, rows, fields) => {
        if (!err)
            res.status(200).send(rows);
        else
            res.status(404).log(err);
    })
});



//Get all Prestation
app.get('/prestation', (req, res) => {
  mysqlConnection.query('SELECT * FROM Prestation JOIN user on prestation.idU = user.id', (err, rows, fields) => {
      if (!err){
          res.status(200).send(rows)
      }    
      else
          res.status(404).send(err)
  })
});


//Get a prestation by id
app.get('/prestation/:id', (req, res) => {
  mysqlConnection.query('SELECT * FROM Prestation WHERE idPres = ?', [req.params.id], (err, rows, fields) => {
      if (!err)
          res.status(200).send(rows);
      else
          res.status(404).log(err);
  })
});

//get All prestations
app.get('/prestations', (req, res) => {
    mysqlConnection.query('SELECT * FROM Prestation ', (err, rows, fields) => {
        if (!err)
            res.status(200).send(rows);
        else
            res.status(404).log(err);
    })
  });


//Insert a new Prestation (getPro)
app.post('/commande/:idUs&:idP', (req, res) => {

  var mysqlTimestamp = moment(Date.now()).format('YYYY-MM-DD');
  var mysqlTimestamp2 = moment(Date.now()).format('HH:mm:ss');

  let us = req.body;
  var sql = "INSERT INTO `Commande` (`idUs`, `idP`, `date`, `heure`) VALUES (?, ?, ?, ?)";
  mysqlConnection.query(sql,[ req.params.idUs, req.params.idP, mysqlTimestamp, mysqlTimestamp2], (err, rows, fields) => {
      if (!err)
          res.status(200).send('commande.');
      else
          res.status(404).log(err);
  })
});


//Get all Prestation
app.get('/pro', (req, res) => {
  mysqlConnection.query('SELECT * FROM User WHERE role=2', (err, rows, fields) => {
      if (!err){
          res.status(200).send(rows)
      }    
      else
          res.status(404).send(err)
  })
});




//Get all Prestation
app.get('/proo', (req, res) => {
  mysqlConnection.query('SELECT * FROM user JOIN prestation on prestation.idU = user.idUser', (err, rows, fields) => {
      if (!err){
          res.status(200).send(rows)
      }    
      else
          res.status(404).send(err)
  })
});

//Get an login
app.get('/commande/:idUs', (req, res) => {
  mysqlConnection.query('SELECT * FROM commande JOIN prestation on prestation.idPres = commande.idP JOIN user on user.idUser = commande.idUs WHERE idUs = ?', [req.params.idUs], (err, rows, fields) => {
      if (!err)
          res.status(200).send(rows);
      else
          res.status(404).log(err);
  })
});


//Insert a new Note (getPro)
app.post('/note/:idU&:idP', (req, res) => {

    let us = req.body;
    var sql = "INSERT INTO `Commentaire` (`note`,`idU`,`idP`) VALUES (?,?,?)";
    mysqlConnection.query(sql,[us.note, req.params.idU, req.params.idP], (err, rows, fields) => {
        if (!err)
            res.status(200).send('note.');
        else
            res.status(404).log(err);
    })
  });
  
//Get an login
app.get('/nbnote/:idP', (req, res) => {
    let us = req.body;
    mysqlConnection.query('SELECT note FROM prestation JOIN commentaire on prestation.idPres = commentaire.idP WHERE idP = ?', [req.params.idP], (err, rows, fields) => {
        if (!err)
            res.status(200).send(rows);
        else
            res.status(404).log(err);
    })
  })


  //Delete an login
app.delete('/delcomm/:idC', (req, res) => {
    mysqlConnection.query('DELETE FROM commande WHERE idC = ?', [req.params.idC], (err, rows, fields) => {
        if (!err)
            res.status(200).send('Deleted successfully.');
        else
            res.status(404).log(err);
    })
});
