const {
  createHmac,
} = require('crypto');

module.exports  = function getChallengeResponse(crcToken) {
	const consumerSecret  = process.env.TWITTER_CONSUMER_SECRET;
	return createHmac('sha256', consumerSecret).update(crcToken).digest('base64')
}