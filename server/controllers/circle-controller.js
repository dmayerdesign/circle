var Circle = require('../datasets/circles');
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

	if ( !req.query.accessCode && req.query.accessAnswer ) { // for creation validation
		Circle.find({accessCode: req.query.accessCode})
		.exec(function(err, response) {
			if (err) {
				res.error(err);
			} else {
				res.json(response[0]);
			}
		});
	}
};

module.exports.styleCircle = function(req, res) {
	Circle.findById(req.body.circleId, function(err, circle) {
		if (err) {
			res.error(err);
		} else if ( circle ) {
			var part = req.body.part;
			circle.styles[part] = req.body.style;
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
		} else if ( circle ) {
			circle.members.push(req.body.member);
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