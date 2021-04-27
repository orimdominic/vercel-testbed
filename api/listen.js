import getChallengeResponse from "./get-challenge-response";

module.exports = async (req, res) => {
  const method = req.method.toLowerCase();
  return sendChallengeResponse(req, res);
};

function sendChallengeResponse(req, res) {
  const { crc_token } = req.query;
  if (!crc_token) {
    return res.status(400).send();
  }
  res.status(200).json({
    response_token: getChallengeResponse(crc_token),
  });
}
