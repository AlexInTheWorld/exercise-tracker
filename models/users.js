const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const Users = new Schema({
  username: {
    type: String, 
    required: [true, 'username must not be empty'],
    unique: true,
    maxlength: [10, 'username too long, 10 characters max']
  }
});

Users.path('username').validate({
  validator: function(val) { 
    if (/\s+/.test(val)) {
    throw new Error('No spaces, please');
  } else {
    return true
  }                        
  },
  message: function(props) {
      return props.reason.message;  
  }
  // `errors['username']` will be "No spaces, please"
});

module.exports = mongoose.model('Users', Users);
