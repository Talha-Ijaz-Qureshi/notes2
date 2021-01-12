require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const ejs = require('ejs');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const TwitterStrategy = require('passport-twitter').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();
let Introduction = 'Press the + button on the bottom-right corner to make a new note.'

app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');
app.use(express.static('public'));

app.use(session({
	secret: process.env.SECRET,
	resave: false,
	saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.DATABASE, {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set('useCreateIndex', true);

//Mongoose Models

const noteSchema = {
	title: String,
	body: String,
	color: String,
	user: String
};

const userSchema = mongoose.Schema({
	email: String,
	username: String,
	password: String,
	googleId: String,
	facebookId: String,
	twitterId: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const Note = mongoose.model('Note', noteSchema);
const User = mongoose.model('User', userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_SECRET_ID,
    callbackURL: 'https://nameless-sea-02575.herokuapp.com/auth/google/notes',
    userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
  },
  function(accessToken, refreshToken, profile, cb) {
	

    User.findOrCreate({ googleId: profile.id, username: profile.emails[0].value }, function (err, user) {
      return cb(err, user);
    });
  }
));

passport.use(new FacebookStrategy({
    clientID: process.env.FB_APP_ID,
    clientSecret: process.env.FB_CLIENT_SECRET,
    callbackURL: "https://nameless-sea-02575.herokuapp.com/auth/facebook/notes"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id, username: profile.displayName }, function (err, user) {
      return cb(err, user);
    });
  }
));

// passport.use(new TwitterStrategy({
//     consumerKey: process.env.TW_APP_KEY,
//     consumerSecret: process.env.TW_SECRET,
//     callbackURL: "http://127.0.0.1:3000/auth/twitter/notes"
//   },
//   function(token, tokenSecret, profile, cb) {
//     User.findOrCreate({ twitterId: profile.id }, function (err, user) {
//       return cb(err, user);
//     });
//   }
// ));

//Get routes

app.get('/', (req,res)=>{
	if (req.isAuthenticated()) {
		res.redirect('/notes');
	} else {
		res.render('homepage');
	};
});

app.get('/notes', (req,res)=>{
	if (req.isAuthenticated()) {
		Note.find({user: req.user._id}, (err,foundNotes)=>{
			if (!err) {
				if (foundNotes.length === 0) {
					res.render('home',{notes: [{title: 'Welcome', body: Introduction}], userId: req.user._id, newUser: true});
				} else {
					res.render('home', {notes: foundNotes, userId: req.user._id, newUser: false})
				};
			} else {
				console.log(err);
			};
		});
	} else {
		res.redirect('/');
	};
});

app.get('/login', (req,res)=>{
	res.render('login');
});

app.get('/register', (req,res)=>{
	res.render('register');
});

app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile",'email'] })
 );

app.get('/auth/facebook',
  passport.authenticate('facebook')
 );

// app.get('/auth/twitter',
//   passport.authenticate('twitter')
//  );

app.get('/auth/google/notes', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });

app.get('/auth/facebook/notes',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });

// app.get('/auth/twitter/notes',
//   passport.authenticate('twitter', { failureRedirect: '/login' }),
//   function(req, res) {
//     res.redirect('/');
//   });

app.get('/:userId/compose', (req,res)=>{
	if (req.isAuthenticated()) {
		res.render('compose', {userId: req.params.userId});
	} else {
		res.redirect('/login')
	};
});

app.get('/delete/:noteId', (req,res)=>{
	if (req.isAuthenticated()) {
		let noteId = req.params.noteId;
   		Note.deleteOne({_id: noteId}, err=>{});
  		res.redirect('/');	
	} else {
		res.redirect('/login')
	};
   
});

app.get('/editNote/:noteID', (req,res)=>{
	if (req.isAuthenticated()) {
		let noteID = req.params.noteID;
		Note.findOne({_id: noteID}, (err, foundNote)=>{
			res.render('edit', {oldNote: foundNote});console
		});
	} else {
		res.redirect('/login')
	};
	
});

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

//Post routes

app.post('/', (req,res)=>{
	let newNote = new Note({
		title: req.body.title,
		body: req.body.body,
		color: req.body.color,
		user: req.body.user
	});
	newNote.save();
	res.redirect('/');
});

app.post('/update', (req,res)=>{
	let noteID = req.body.id;
	let newTitle = req.body.title;
	let newBody = req.body.body;
	let newColor = req.body.color;
	Note.findByIdAndUpdate(noteID, {
		title: newTitle,
		body: newBody,
		color: newColor
	}, err=>{});
	res.redirect('/');
});

app.listen(process.env.PORT, ()=>{
	console.log('Server has started');
});