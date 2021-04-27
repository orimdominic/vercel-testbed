import getChallengeResponse from "./get-challenge-response"
module.exports = (req, res) => {
	const {crc_token} = req.query
  res.json({
    response_token: getChallengeResponse(crc_token),
  })
}
