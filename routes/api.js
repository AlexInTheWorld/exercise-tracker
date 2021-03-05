const Users = require('../models/users');
const Exercises = require('../models/exercises');

const router = require('express').Router();

function return_msg(err) {
  let msg;
  let keys = Object.keys(err.errors);
      if (keys[0] == 'ValidatorError') {
        msg = err.errors[keys[0]].message;
      } else {
        msg = 'invalid ' + keys[0];
      }
  return [msg, 'danger']
}

router.post('/new-user', (req, res) => {
  var message, status;
  const user = new Users(req.body);
  // Check conformity to defined validation rules in the schema:
  var error = user.validateSync();
    if (error) {
       // Show error on the page for the user to see
    let keys = Object.keys(error.errors);
    message = error.errors[keys[0]].message;
    status = 'danger';
    res.render('new_user', {message: [message, status]});
  } else {
    user.save((err, savedUser) => {
    if(err) {
      message = err.code === 11000 ? 'Username already taken' : 'Internal Server Error';
      status = 'danger';
    } else {
      message = 'Signed up as ' + savedUser.username;
      status = 'success';
    }
      res.render('new_user', {message: [message, status]})
  })
  }
})

router.post('/add', async (req, res) => {
  var message, status, user, exercise, values;
  user = await Users.findOne({username: req.body.username});
  if (!user) {
    message = "Username not registered";
    status = "danger";
  } else if (!user._id) {
    message = 'Internal Server Error';
    status = "danger";
  } else {
    exercise = new Exercises(req.body);
    exercise.username = user.username;
    if (!exercise.date) { exercise.date = Date.now() }
    var error = exercise.validateSync();
    if (error) {
      [message, status] = return_msg(error);      
    } else {
      if (exercise.date.getTime() > Date.now()) {
        message = "Date out of range"
        status = "danger"
      } else {
        message = await exercise.save();
        if (!message._id) { 
          message = 'Internal Server Error';
          status = "danger";
        } else {
          message = "Successfully added exercise!"
          status = "success";
        }
      }
    }
    if (status == 'danger') {
      values = {
        username: req.body.username,
        description: req.body.description,
        duration: req.body.duration,
        date: req.body.date
      }
    }
  }
  res.render('homepage', {message: [message, status, values]});
})

router.get('/users', (req, res) => {
  Users.find({}, (err, data) => {
    if (err) res.send(err);
    res.json(data);
  })
})

router.get('/log', (req, res, next) => {
  const from = req.query.from == "" ? new Date(0) : new Date(req.query.from);
  const to = req.query.to == "" ? new Date(Date.now()) : new Date(req.query.to);
  var message   = 'Internal server error, try again',
      status    = 'danger',
      values    = {
                    username: req.query.username,
                    limit: req.query.limit,
                    from: req.query.from,
                    to: req.query.to
                  };
  var log_data = async function getlogdata() {
    if (from.toString() === 'Invalid Date') {
      message = 'invalid date ("from" input)'
  } else if (to.toString() === 'Invalid Date') {
      message = 'invalid date ("to" input)'
  } else if (to.getTime() < to.getTime()) {
      message = 'date out of range ("to")'
  } else {
    var user = await Users.findOne({username: req.query.username});  
    if (!user) {
      message = "Username not registered";
    } else if (user._id) {
      let exercises = await Exercises.find({
      username: req.query.username,
        date: {
          $lte: to.toISOString(),
          $gte: from.toISOString()
        }
      }, {
        __v: 0,
        _id: 0
      })
    .sort('-date')
    .limit(parseInt(req.query.limit));
      message = {
          _id: req.query.userId,
          username: user.username,
          from : from.toDateString(),
          to : to.toDateString(),
          count: exercises.length,
          log: exercises.map(e => ({
            description : e.description,
            duration : e.duration,
            date: e.date.toDateString()
          })
        )
      }
      status = 'info';
      for (let key in values) {
        values[key] = ""
      }
  }
  }
    return [message, status, values]
  }
  
  log_data().then(result => res.render('show', {message: result}));

})

router.get('/new-user', (req, res) => {
  res.render('new_user', {message: [null]})
})

router.get('/show', (req, res) => {
  res.render('show', {message: null})
})

module.exports = router
