
const bodyParser  = require('body-parser');
const express     = require('express');
const app         = express();
const mongoose    = require('mongoose');


// Connection to DB: //
mongoose.connect(process.env.DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}); 
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));

app.set("view engine", "ejs");
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
mongoose.set('useCreateIndex', true);

//Homepage rendering
app.get('/', (req, res) => {
  res.render('homepage', {message: null});
})
// Import the router and use it as middleware that handles requests on path /api/exercise/...
const apiRouter = require('./routes/api');
app.use('/api/exercise', apiRouter);

// // Not found middleware
app.use((req, res, next) => {
  res.json({error: 'NOT FOUND'})
})

const portNum = process.env.PORT;
// In case I want to depopulate the 'users' collection we have created above.
// db.dropCollection('users');
// Listen for requests
app.listen(portNum, () => {
  console.log(`Listening on port: ${portNum}`);
});