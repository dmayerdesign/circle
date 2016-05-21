var mongoose = require('mongoose');
module.exports = mongoose.model('User', {
	email: String,
	username: String,
	password: String,
	avatar: String,
	bio: String,
	accessCodes: [String],
	circles: String,
	following: [{userId: String}],
	followers: [{userId: String}],
	emailVerification: String,
	isEmailVerified: Boolean
});