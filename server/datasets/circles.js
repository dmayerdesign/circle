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
		palette: {type: String, default: "original-blue"},
		font: {type: String, default: "helvetica"},
		bg: {type: String, default: "/images/default-bg.jpg"},
		logo: String,
		css: String,
		lastEditedBy: String
	},
	tags: [String],
	currency: {
		singularName: {type: String, default: "shnoggle"},
		pluralName: {type: String, default: "shnoggles"},
		symbol: {type: String, default: "/images/default-currency-symbol.png"},
		lastEditedBy: String
	}
})