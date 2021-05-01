const ParseCmdTextError = require("./ParseCmdTextError");

module.exports = async function handleTweetCreateEvents(payload, res) {
  const realMentions = payload.tweet_create_events.filter(isRealMention);
  if (!realMentions.length) {
    return res.status(200).send();
  }
  const mentions = realMentions
    .map(setMentionObject)
    .map(setMentionCommandText)
    .filter(isValidCmdText);
  if (!mentions.length) {
    return res.status(200).send();
  }
  const [cancelSelectionReqTweets, makeSelectionReqTweets] = [
    mentions.filter(isCancellationTweet),
    mentions.filter((m) => !isCancellationTweet(m)),
  ];
  if (cancelSelectionReqTweets.length) {
    for (const tweet of cancelSelectionReqTweets) {
      try {
        await cancleSelectionReq(tweet);
      } catch (e) {
        console.error(`cancellation request for "${tweet.id}" failed`);
        console.error(JSON.stringify(e));
      }
    }
  }
  if (makeSelectionReqTweets.length) {
    for (const tweet of makeSelectionReqTweets) {
      try {
        const [count] = Promise.all([
          await getEngagementCount(tweet),
          await getEngagementType(tweet),
        ]);
      } catch (e) {
        console.error(JSON.stringify(e));
        console.error(`make selection request for "${tweet.id}" failed`);
        await replyTweet(tweet.id, e.message);
      }
    }
  }
  // console.log(JSON.stringify(mentions, null, 4));
  return;
};

function isRealMention(tweet) {
  // ignore retweets, but accept quotes
  if (tweet.retweeted_status && !tweet.is_quote_status) {
    return false;
  }
  // ignore tweets by self
  if (tweet.user.screen_name === process.env.PICKATRANDOM_SCREEN_NAME) {
    return false;
  }
  return true;
}

function setMentionObject(tweet) {
  return {
    createdAt: tweet.created_at,
    id: tweet.id_str,
    refTweetId: tweet.in_reply_to_status_id_str,
    authorName: tweet.user.screen_name,
    authorId: tweet.user.id_str,
    text: tweet.truncated ? tweet.extended_tweet.full_text : tweet.text,
    urls: tweet.entities.urls,
  };
}

function setMentionCommandText(tweet) {
  const lastMentionIndex = tweet.text.lastIndexOf(
    `${process.env.PICKATRANDOM_SCREEN_NAME}`
  );
  const cmdText = tweet.text
    .substring(lastMentionIndex)
    .replace(`${process.env.PICKATRANDOM_SCREEN_NAME} `, "")
    .toLowerCase()
    .trim();
  return {
    ...tweet,
    cmdText,
  };
}

function isValidCmdText({ cmdText }) {
  return cmdText.length;
}

function isCancellationTweet({ cmdText }) {
  return cmdText.startsWith("cancel");
}

async function cancleSelectionReq(tweet) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      console.log(`handled selection cancellation for "${tweet.id}"`);
      resolve();
    }, 100);
  });
}

async function getEngagementCount({ cmdText }) {
  return new Promise((resolve) => {
    const [countStr] = cmdText.split(" ");
    const count = parseInt(countStr, 10);
    if (Number.isNaN(count)) {
      const errMsg = `😟 I wasn't able to find the number of engagements you want.
      Could you try again with the format "@PickAtRandom N .."? N being the number of engagements.`;
      throw new ParseCmdTextError(msg);
    }
    if (count < 1) {
      const errMsg = `Nice trick, but no one can randomly pick any number of engagements less than 1 😉`;
      throw new ParseCmdTextError(msg);
    }
    resolve(count);
  });
}

async function getEngagementType({ cmdText }) {
  return new Promise((resolve) => {
    const [_, engagementType] = cmdText.split(" ");
    const errMsg = `Uh oh 😟! I couldn't decipher the engagement type you provided.
    Could you try again with any of 'retweets'`;
    if (engagementType.length < 2) {
      throw new ParseCmdTextError(errMsg);
    }
    const sub = engagementType.substring(0, 3);
    switch (sub) {
      case "ret":
        return retweets;
      // TODO: When the algorithm for finding replies is developed, add it
      default:
        throw new ParseCmdTextError(errMsg);
    }
  });
}

async function replyTweet(id, msg) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      console.log(`replied to "${id}" with msg "${msg}"`);
      resolve();
    }, 100);
  });
}
