var mongoose = require('mongoose');
var User = require('../datasets/users');

module.exports.signup = function(req, res) {
	var signedUp = false;
	var randomOfFive = Math.floor(Math.random() * 5);
	var avatarColors = ["#a5dff9", "#ef5285", "#60c5ba", "#a593e0", "#4ea1d3"];


	User.find({email: req.body.email}, function(err, results) {
		if (err) {
			console.error(err);
		}

		if (results.length) {
			console.log("Looks like your email's already in our system!");
			signedUp = true;
			res.json({userExists: true});
			return;
		} else {
			var newUser = new User(req.body);

			newUser.primaryColor = avatarColors[randomOfFive];

			newUser.save(function(err, user) {
				res.json(user);
			});
		}
	});
};

module.exports.login = function(req, res) {
	User.find(req.body, function(err, results) {
		if (err) {
			console.error(err);
			res.json({
				status: 500
			});
		}
		if (results) {
			var user = results[0];
			if ( !user ) {
				console.log("couldn't log in");
			} else {
				console.log( "results (user should be 0th):");
				console.log(results);
				res.json(user);
			}
		}
	});
};

module.exports.verifyEmail = function(req, res) {
	User.findById(req.body.userId, function(err, user) {
		user.emailVerification = user.emailVerification || req.body.code;
		user.isEmailVerified = true;

		user.save(function(err, userData) {
			if (err) {
				console.log("failed to update email verification");
				res.json({status: 500});
			} else {
				console.log("successfully updated the email verification!");
				res.json(userData);
			}
		});
	});
};