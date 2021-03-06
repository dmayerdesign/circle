var mongoose = require('mongoose');
module.exports = mongoose.model('User', {
	email: String,
	username: String,
	password: String,
	name: String,
	avatar: String,
	bio: String,
	accessCodes: [String],
	following: [{userId: String}],
	followers: [{userId: String}],
	emailVerification: String,
	isEmailVerified: Boolean,
	primaryColor: String,
	currency: {type: Number, default: 0},
	achievements: [
		{
			title: String
		}
	],
	notifications: [
		{
			circleId: String,
			creator: String,
			action: String,
			postId: String
		}
	]
});