var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');

var User = new Schema({
  name: String,
  username: {
    type:String,
    required: true,
    //username cannot be duplocated
    index: {
      unique:true,
    }
  },
  password:{
    type:String,
    required:true,
    select:false
  }
});

//hash password before the user is saved
User.pre('save', function(next){
  var user = this;
  // hash only if the password has been changed/user is new
  if (!user.isModified('password'))
    return next();
  //generate the hash
  bcrypt.hash(user.password, null, null, function(err, hash){
    if (err)
      return next(err);
    user.password = hash;
    next();
  });
});

// method to cpmpare a given password with the db hash
User.methods.comparePassword = function(password) {
  var user = this;
  return bcrypt.compareSync(password, user.password);
};

module.exports = mongoose.model('User', User);
