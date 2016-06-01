var express = require('express'),
	mongoose = require('mongoose'),
	bodyParser = require('body-parser'),
	path = require('path'),
	multipart = require('connect-multiparty'),
	multipartMiddleware = multipart();

var app = express();


// Server Controllers
var authenticationController = require('./server/controllers/authentication-controller');
var profileController = require('./server/controllers/profile-controller');
var postController = require('./server/controllers/post-controller');
var usersController = require('./server/controllers/users-controller');
var circleController = require('./server/controllers/circle-controller');
var tagController = require('./server/controllers/tag-controller');
var mailgunController = require('./server/controllers/mailgun-controller');

mongoose.connect('mongodb://localhost:27017/circle');

app.use(bodyParser.json());
app.use(multipartMiddleware);
app.use('/app', express.static(__dirname + "/app"));
app.use('/node_modules', express.static(__dirname + "/node_modules"));
app.use('/uploads', express.static(__dirname + "/uploads"));
app.use('/images', express.static(__dirname + "/images"));
app.use('/scripts', express.static(__dirname + "/scripts"));
app.use('/styles', express.static(__dirname + "/styles"));
app.use('/app-bar', express.static(__dirname + "/app/app-bar"));

// Index
app.get('/', function(req, res) {
	res.sendFile('index.html', { root: path.join(__dirname, '') });
});

// Circle
app.post('/api/circle/new', circleController.createCircle);
app.get('/api/circle/get', circleController.getCircle);
app.post('/api/circle/style', circleController.styleCircle);
app.post('/api/circle/addMember', circleController.addMember);
app.post('/api/circle/updateBackground', multipartMiddleware, circleController.updateBackground);
app.post('/api/circle/updateLogo', multipartMiddleware, circleController.updateLogo);

// Authentication
app.post('/api/user/signup', authenticationController.signup);
app.post('/api/user/login', authenticationController.login);
app.post('/api/user/verifyEmail', authenticationController.verifyEmail);

// Emails
app.get('/email/verify/:email/:vcode', mailgunController.verifyEmail);
app.post('/email/newCircle', mailgunController.newCircle);

// Profile
app.post('/api/profile/updatePhoto', multipartMiddleware, profileController.updatePhoto);
app.post('/api/profile/editProfile', profileController.editProfile);

// Posts
app.post('/api/post/post', postController.postPost);
app.post('/api/post/delete', postController.deletePost);
app.get('/api/post/get', postController.getPosts);
app.get('/api/post/getSingle', postController.getPost);
app.post('/api/post/updatePostUser', postController.updatePostUser);
app.post('/api/post/attachImage', postController.attachImage);

// Comments
app.post('/api/comment/post', postController.postComment);

//Quests
app.post('/api/quest/updateQuestStatus', postController.updateQuestStatus);
app.post('/api/quest/userCompletedQuest', postController.userCompletedQuest);

// Tags
app.post('/api/tags/addTag', tagController.addTag);
app.get('/api/tags/getTags', tagController.getTags);

// User
app.get('/api/users/get', usersController.getUsers);
app.get('/api/users/getUser', usersController.getUser);
app.get('/api/users/getAvatar', usersController.getUserAvatar);
// app.post('/api/user/notify', usersController.notifyUser);
app.post('/api/user/clearNotification', usersController.clearNotification);


app.listen('3000', function() {
	console.log("Listening for localhost:3000");
});