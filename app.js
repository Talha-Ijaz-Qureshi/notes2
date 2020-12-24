const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const ejs = require('ejs');

const app = express();
mongoose.connect('mongodb+srv://Abban-admin:yeet123@notes.3dqgm.mongodb.net/notesDB', {useNewUrlParser: true, useUnifiedTopology: true});

app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');
app.use(express.static('public'));

//Notes Model

const noteSchema = {
	title: String,
	body: String,
	color: String
}

const Note = mongoose.model('Note', noteSchema);

//Get routes

app.get('/', (req,res)=>{
	Note.find({}, (err, notes)=>{
		if (notes !== []) {
			res.render('home', {notes: notes})
		} else {
			res.render('home',{notes: []})
		}
		
	});
});

app.get('/compose', (req,res)=>{
	res.render('compose');
});

app.get('/delete/:noteID', (req,res)=>{
	let noteID = req.params.noteID;
	Note.deleteOne({_id: noteID}, err=>{});
	res.redirect('/')
});

app.get('/editNote/:noteID', (req,res)=>{
	let noteID = req.params.noteID;

	Note.findOne({_id: noteID}, (err, foundNote)=>{
		res.render('edit', {oldNote: foundNote});
		console.log(foundNote);
	});
	
})

//Post routes

app.post('/', (req,res)=>{
	let note = new Note({
		title: req.body.title,
		body: req.body.body,
		color: req.body.color
	});
	note.save();
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

let port = process.env.PORT;
if (port === null || port === '') {
	port === 3000;
};

app.listen(port, ()=>{
	console.log('Server has started');
});