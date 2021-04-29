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

module.exports = async function handleDm(payload) {
  console.log("handle dm payload -", payload);
  // Messages are wrapped in an array, so we'll extract the first element
  const [message] = payload.direct_message_events;
  console.log("message received -", message);
  // We check that the message is valid
  if (
    typeof message === "undefined" ||
    typeof message.message_create === "undefined"
  ) {
    console.log("message is invalid");
    res.status(200).send()
  }

  // We filter out message you send, to avoid an infinite loop
  if (
    message.message_create.sender_id ===
    message.message_create.target.recipient_id
  ) {
    console.log('message was sent by @PickAtRandom');
    res.status(200).send()
  }

  if (
    message.message_create.target.recipient_id !==
    process.env.PICKATRANDOM_USERID
  ) {
    console.log("message is not for @PickAtRandom");
    res.status(200).send()
  }
  // Prepare and send the message reply
  const messages = [
    "@PickAtRandom is cooking. Chill. All of us will eat breakfast.",
    "Hmm.. Wahala for whoever isn't using @PickAtRandom.",
  ];
  const respMsg = messages[Math.floor(Math.random() * messages.length)];
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
            text: `${respMsg}`,
          },
        },
      },
    },
  };
  try {
    await post(requestConfig);
    console.log("message sent");
    return res.status(200).send()
  } catch (error) {
    console.error("message not sent");
    console.error(error);
    return res.status(200).send()
  }
}