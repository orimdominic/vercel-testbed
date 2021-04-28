import getChallengeResponse from "./get-challenge-response";

module.exports = async (req, res) => {
  const method = req.method.toLowerCase();
  switch (method) {
    case 'get':
      return sendChallengeResponse(req, res);
    case "post" :
      return handleAccountActivity(req, res)
    default:
      res.status(405).send()
      break;
  }
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

function handleAccountActivity(req, res) {
  console.log("account event payload", req.body)
  res.end()
}
