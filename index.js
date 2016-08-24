var express = require('express'),
  app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var mongoose = require('mongoose');
var jwt = require('jsonwebtoken');
var superSecret = 'whatwhatwhatwhatwhat';
var port = process.env.PORT || 8080;
var User = require('./app/models/users.js');

mongoose.connect('mongodb://localhost/mean');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(function(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
  next();
});

app.use(morgan('dev'));

app.get('/', function(req, res){
  res.send('Welcome to the home page!!');
});

var router = express.Router();

// create token for authenticated users
router.post('/authenticate', function(req, res){
  User.findOne({
    username: req.body.username
  }).select('name username password').exec(function(err, user){
    if (err){
      throw err;
    }

    // no user with that name
    if (!user){
      res.json({
        success: false,
        message: 'Authentication failed. User not found'
      });
    }
    else if (user){
      // check if password matches
      var validPassword = user.comparePassword(req.body.password);
      if (!validPassword){
        res.json({
          success: false,
          message: 'Wrong password'
        });
      } else {
        // if user is found and password is right
        // create token
        var token = jwt.sign({
          name: user.name,
          username: user.username
        }, superSecret, {
          expiresIn: 1440 //expires in 24 hrs
        });

        //return the information including token as json
        res.json({
          success: true,
          message: 'Enjoy your token!',
          token: token
        });
      }
    }
  });
});

// route middleware to verify a token
router.use(function(req, res, next){
  // check header/url/post parameters for tokens
  var token = req.body.token || req.param('token') || req.headers['x-access-token'];

  //decode token
  if (token) {
    // verifies secret and checks exp
    jwt.verify(token, superSecret, function(err, decoded){
      if(err) {
        return res.status(403).send({
          success: false,
          message: 'Failed to authenticate token'
        });
      } else {
        // if everything is good, save to request for use in other routes
        req.decoded = decoded;
        next();
      }
    });
  } else {
    // if there is no token
    // return an HTTP response of 403 (access  forbidden) and an error message
    return res.status(403).send({
      success: false,
      message: 'No token provided'
    });
  }
});

// router.param('name', function(req, res, next, name){
//   console.log('Some validation for ' + name);
//   req.name = name;
//   next();
// })

router.get('/', function(req, res){
  res.json({message: 'Hey you are using the API'});
});

router.route('/users')
  .post(function(req, res){
    var user = new User;
    user.name = req.body.name;
    user.username = req.body.username;
    user.password = req.body.password;

    user.save(function(err){
      if(err)
        res.send(err);
      res.json({message: 'New user created successfully'});
    });
  })
  .get(function(req, res){
    User.find(function(err, users){
      if (err)
        res.send(err)
      res.send(users);
    })
  })

router.get('/me', function(req, res){
  res.send(req.decoded);
})

router.route('/users/:user_id')
  .get(function(req, res){
    User.findById(req.params.user_id, function(err, user){
      if (err)
        res.send(err);
      res.send(user);
    });
  })
  .put(function(req, res){
    User.findById(req.params.user_id, function(err, user){
      if (err)
        res.send(err)
      if(req.body.name)
        user.name = req.body.name;
      if(req.body.username)
        user.username = req.body.username;
      if(req.body.password)
        user.password = req.body.password;

      user.save(function(err){
        if(err)
          res.send(err);
        res.json({message: 'Updated user successfully'});
      });
    })
  })
  .delete(function(req, res){
    User.remove({_id:req.params.user_id}, function(err){
      if(err)
        res.send(err);
      res.json({message: 'User removed successfully'});
    });
  })


app.use('/api', router);
app.listen(port);

console.log('Listen to 8080');
