var Circle = require('../datasets/circles');
var User = require('../datasets/users');
var fs = require('fs-extra');
var path = require('path');
var mkdirp = require('mkdirp');

module.exports.createCircle = function(req, res) {
	var circle = new Circle(req.body);
	var accessCodeExists = false;

	console.log(circle);

	Circle.find({accessCode: circle.accessCode})
	.exec(function(err, circles) {
		if (err || circles[0]) {
			res.error(err);
			return;
		}

		circle.save(function(err, circleData) {
			if (err) {
				console.log("Save failed :(");
				res.json({status: 500});
			} else {
				console.log("Save successful! ^_^");
				console.log(circleData);
				res.json(circleData);
			}
		});
	});
};

module.exports.getCircle = function(req, res) {
	if ( req.query.joining ) {
		if ( req.query.accessCode && req.query.accessAnswer ) {
			Circle.find({accessCode: req.query.accessCode, accessAnswer: req.query.accessAnswer})
			.exec(function(err, response) {
				if (err) {
					res.error(err);
				} else {
					res.json(response[0]);
				}
			});
		}
	}
	else {
		if ( req.query.accessCode ) {
			Circle.find({accessCode: req.query.accessCode})
			.exec(function(err, response) {
				if (err) {
					res.error(err);
				} else {
					res.json(response[0]);
				}
			});
		}
		if ( req.query.accessAnswer ) {
			Circle.find({accessAnswer: req.query.accessAnswer})
			.exec(function(err, response) {
				if (err) {
					res.error(err);
				} else {
					res.json(response[0]);
				}
			});
		}
	}
};

module.exports.getCircles = function(req, res) {
	Circle.find({members: req.query.username}, function(err, circles) {
		if (err) {
			res.error(err);
		} else {
			res.json(circles);
		}
	});
};

module.exports.styleCircle = function(req, res) {
	Circle.findById(req.body.circleId, function(err, circle) {
		if (err) {
			res.error(err);
		} else if ( circle ) {
			var part = req.body.part;
			circle.styles[part] = req.body.style;
			circle.styles.lastEditedBy = req.body.userId;
			circle.save(function(err) {
				if (err) {
					console.log("Circle styles update failed :(");
					res.json({status: 500});
				} else {
					console.log("Updated the circle styles! ^_^");
					res.json({
						circle: circle
					});
				}
			});
		}
	});
};

module.exports.addMember = function(req, res) {
	Circle.findById(req.body.circleId, function(err, circle) {
		if (err) {
			res.error(err);
		} 
		else if ( circle && circle.members.length > 49 ) {
			console.log("This circle already has the maximum number of members allowed. Sorry!");
		}
		else if ( circle ) {
			circle.members.push(req.body.member);
			circle.save(function(err) {
				if (err) {
					console.log("Failed to add the member");
					res.json({status: 500});
				} else {
					console.log("Added the new member!");
					res.json({
						circle: circle
					});
				}
			});
		}
	});
};

module.exports.removeMember = function(req, res) {
	// circleId, accessCode, member (username only)
	Circle.findById(req.body.circleId, function(err, circle) {
		if (err) {
			res.error(err);
		} 
		else if ( circle ) {
			circle.members.splice(circle.members.indexOf(req.body.member), 1);
			circle.save(function(err) {
				if (err) {
					console.log("Failed to remove the member");
					res.json({status: 500});
				} else {
					User.findOne({username: req.body.member}, function(err, user) {
						if (err) {
							res.error(err);
						} else {
							var userCircles = JSON.parse(user.circles);
							for (var accessCode in userCircles) {
								if (accessCode === req.body.accessCode) {
									delete userCircles[accessCode];
								}
							}
							user.circles = JSON.stringify(userCircles);
							user.accessCodes.splice(user.accessCodes.indexOf(req.body.accessCode), 1);
							
							user.save(function(err) {
								if (err) {
									console.log("Failed to remove the circle from the user");
								} else {
									console.log("Successfully removed this person from the circle");
									res.json({
										circle: circle
									});
								}
							});
						}
					});	
				}
			});
		}
	});
};

module.exports.updateBackground = function(req, res) {
	var file = req.files.file,
		userId = req.body.userId,
		circleId = req.body.circleId;

	console.log("User " + userId + " is submitting " , file);

	var uploadDate = new Date().getTime();

	mkdirp( path.join(__dirname, "../../uploads/" + circleId), function(err) {

		if (err) {
			console.log("couldn't create the circle directory in uploads");
			return;
		}
		
		var tempPath = file.path;
		var targetPath = path.join(__dirname, "../../uploads/" + circleId + "/" + userId + "_" + uploadDate + "_" + file.name);
		var savePath = "/uploads/" + circleId + "/" + userId + "_" + uploadDate + "_" + file.name;

		fs.rename(tempPath, targetPath, function(err) {
			if (err) {
				console.log(err);
			} else {
				Circle.findById(circleId, function(err, circleData) {
					var circle = circleData;
					circle.styles.bg = savePath;
					circle.styles.lastEditedBy = userId;
					circle.save(function(err) {
						if (err) {
							console.log("Save failed :(");
							res.json({status: 500});
						} else {
							console.log("Save successful! ^_^");
							res.json(circle);
						}
					})
				});
			}
		});
	});
};

module.exports.updateLogo = function(req, res) {
	var file = req.files.file,
		userId = req.body.userId,
		circleId = req.body.circleId;

	console.log("User " + userId + " is submitting " , file);

	var uploadDate = new Date().getTime();

	mkdirp( path.join(__dirname, "../../uploads/" + circleId), function(err) {

		if (err) {
			console.log("couldn't create the circle directory in uploads");
			return;
		}
		
		var tempPath = file.path;
		var targetPath = path.join(__dirname, "../../uploads/" + circleId + "/" + userId + "_" + uploadDate + "_" + file.name);
		var savePath = "/uploads/" + circleId + "/" + userId + "_" + uploadDate + "_" + file.name;

		fs.rename(tempPath, targetPath, function(err) {
			if (err) {
				console.log(err);
			} else {
				Circle.findById(circleId, function(err, circleData) {
					var circle = circleData;
					circle.styles.logo = savePath;
					circle.styles.lastEditedBy = userId;
					circle.save(function(err) {
						if (err) {
							console.log("Save failed :(");
							res.json({status: 500});
						} else {
							console.log("Logo save successful! ^_^");
							console.log(circle);
							res.json(circle);
						}
					})
				});
			}
		});
	});
};

module.exports.updateCurrency = function(req, res) {
	Circle.findById(req.body.circleId, function(err, circle) {
		if (err) {
			res.error(err);
		} else if ( circle ) {
			circle.currency = req.body.currency;
			circle.save(function(err) {
				if (err) {
					console.log("Circle currency update failed :(");
					res.json({status: 500});
				} else {
					console.log("Updated the circle currency! ^_^");
					res.json(circle);
				}
			});
		}
	});
};

