var mongoose = require('mongoose');

module.exports = mongoose.model('Circle', {
	name: String,
	creatorId: String,
	accessRiddle: String,
	accessAnswer: String,
	accessCode: String,
	dateCreated: {type: Date, default: Date.now},
	members: [String],
	styles: {
		theme: {type: String, default: "smooth"},
		palette: {type: String, default: "original"},
		font: {type: String, default: "montserrat"},
		bg: {type: String, default: "/images/default-bg.jpg"},
		css: String
	},
	tags: [String]
})