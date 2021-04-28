import getChallengeResponse from "./get-challenge-response";
const util = require("util");
const request = require("request");
const get = util.promisify(request.get);
const post = util.promisify(request.post);

const oAuthConfig = {
  token: process.env.TWITTER_TOKEN,
  token_secret: process.env.TWITTER_TOKEN_SECRET,
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
};

module.exports = async (req, res) => {
  const method = req.method.toLowerCase();
  switch (method) {
    case "get":
      return sendChallengeResponse(req, res);
    case "post":
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
  console.log("account event payload", req.body);
  // We check that the message is a direct message
  if (!req.body.direct_message_events) {
    res.end();
  }

  // Messages are wrapped in an array, so we'll extract the first element
  const [message] = req.body.direct_message_events;
  console.log("message received", message);
  // We check that the message is valid
  if (
    typeof message === "undefined" ||
    typeof message.message_create === "undefined"
  ) {
    console.log("message is invalid");
    res.end();
  }

  // We filter out message you send, to avoid an infinite loop
  if (
    message.message_create.sender_id ===
    message.message_create.target.recipient_id
  ) {
    res.end();
  }

  if (
    message.message_create.target.recipient_id !==
    process.env.PICKATRANDOM_USERID
  ) {
    console.log("message is not for @PickAtRandom");
    res.end();
  }
  // Prepare and send the message reply
  const messages = [
    "@PickAtRandom is cooking. Chill. All of us will eat breakfast.",
    "Hmm.. Wahala for whoever isn't using @PickAtRandom.",
  ];
  const respMsg = Math.floor(Math.random() * messages.length);
  console.log("responding with", respMsg);
  const requestConfig = {
    url: "https://api.twitter.com/1.1/direct_messages/events/new.json",
    oauth: oAuthConfig,
    json: {
      event: {
        type: "message_create",
        message_create: {
          target: {
            recipient_id: message.message_create.sender_id,
          },
          message_data: {
            text: `${respMsg}!`,
          },
        },
      },
    },
  };
  try {
    await post(requestConfig);
    console.log("message sent");
    res.end();
  } catch (error) {
    console.error("message not sent");
    console.error(error);
    res.end();
  }
}
