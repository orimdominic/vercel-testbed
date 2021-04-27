import getChallengeResponse from "./get-challenge-response";

module.exports = async (req, res) => {
  const method = req.method.toLowerCase();
  switch (method) {
    case "get":
      return sendChallengeResponse(req, res);
    default:
      return res.status(405).send("Method not implemented");
  }
};

async function sendChallengeResponse(req, res) {
  const { crc_token } = req.query;
  res.json({
    response_token: getChallengeResponse(crc_token),
  });
}
