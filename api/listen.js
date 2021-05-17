import getChallengeResponse from "../get-challenge-response";
import handleDm from "../handle-dm";
import handleTweetCreateEvents from "../handle-tweet-create-events";
const {cache} = require("../cache")

module.exports = async (req, res) => {
  const method = req.method.toLowerCase();
  switch (method) {
    case "get":
      return sendChallengeResponse(req, res);
    case "post":
      await testRedis(req, res)
      await handleAccountActivity(req, res);
      return;
    default:
      res.status(405).send();
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

async function handleAccountActivity(req, res) {
  if (
    !req.body.for_user_id ||
    req.body.for_user_id !== process.env.PICKATRANDOM_USERID
  ) {
    return;
  }
  // We check that the message is a direct message
  if (req.body.direct_message_events) {
    await handleDm(req.body, res);
  }
  if (req.body.tweet_create_events) {
    await handleTweetCreateEvents(req.body, res);
  }
  return res.status(200).send();
}

async function testRedis(req, res) {
  const {data} = req.body
  await cache.set(data.key, data.value)
  res.status(200).send('done')
}