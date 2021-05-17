const ParseCmdTextError = require("./ParseCmdTextError");
const dateTimeParser = require("./time-parser");

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
  // FIXME: What id there is a new format, say "@PickAtRandom issue: I did not get good selections?"
  const [cancelSelectionReqTweets, makeSelectionReqTweets] = [
    mentions.filter(isCancellationTweet),
    mentions.filter((m) => !isCancellationTweet(m)),
  ];
  if (cancelSelectionReqTweets.length) {
    for (const tweet of cancelSelectionReqTweets) {
      try {
        await cancleSelectionReq(tweet);
        // TODO: Add cancellation message
        await replyTweet(id, "");
        // TODO: Report failure metrics
      } catch (e) {
        console.error(`cancellation request for "${tweet.id}" failed`);
        console.error(JSON.stringify(e));
        // TODO: Add cancellation message
        await replyTweet(id, "");
      }
    }
  }
  if (makeSelectionReqTweets.length) {
    for (const tweet of makeSelectionReqTweets) {
      try {
        /*
        using promises for this cos the design pattern helps catch
        any of the errors in one place and responds adequately
         */
        const [
          count,
          engagement,
          selectionDateStr,
          selectionTweetId,
        ] = Promise.all([
          await getEngagementCount(tweet.cmdText),
          await getEngagementType(tweet.cmdText),
          await getSelectionDate(tweet),
          await getSelectionTweetId(tweet),
        ]);
      } catch (e) {
        console.error(JSON.stringify(e));
        console.error(`make selection request for "${tweet.id}" failed`);
        await replyTweet(
          tweet.id,
          `Hello @${tweet.authorName}
          ${e.message}`
        );
        // TODO: Report failure metric
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

async function getEngagementCount(cmdText) {
  return new Promise((resolve) => {
    const [countStr] = cmdText.split(" ");
    const count = parseInt(countStr.trim(), 10);
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

async function getEngagementType(cmdText) {
  return new Promise((resolve) => {
    const [_, engagementType] = cmdText.split(" ");
    const errMsg = `Uh oh 😟! I couldn't decipher the engagement type you provided.
    Could you try again with any of 'retweets'`;
    if (engagementType.length < 2) {
      throw new ParseCmdTextError(errMsg);
    }
    const sub = engagementType.trim().substring(0, 3);
    switch (sub) {
      case "ret":
        resolve("retweets");
      // FIXME: When the algorithm for finding replies is developed, include it
      default:
        throw new ParseCmdTextError(errMsg);
    }
  });
}

async function getSelectionDate({ cmdText, refDate }) {
  // this snippet of code runs on vibes and insha Allah. lol
  // converting human language to computer language is a feat!
  return new Promise((resolve) => {
    let [_, __, ...datePhrase] = cmdText.split(" ");
    if (!datePhrase.length) {
      throw new ParseCmdTextError(`😧 I couldn't find a date for making your random selection.
      Could you please try again and include a selection date?`);
    }
    datePhrase = datePhrase.join(" ");
    let selectionDateStr = dateTimeParser.parseDate(datePhrase, refDate, {
      forwardDate: true,
    }); // returns either a date string or null
    if (!selectionDateStr) {
      throw new ParseCmdTextError(`😰 I couldn't figure out the date for selection from what you submitted.
      Could you please try again with a more specific selection date?`);
    }
    resolve(selectionDateStr);
  });
}

async function getSelectionTweetId({ id, refTweetId, cmdText, urls }) {
  // check if there is a url, return url id, else
  // check if there is a refTweetId, return refTweetId, else
  // return id
  const twitterUrlMatcher = "for https://t.co/";
  const hasTweetStatusUrlRef = cmdText.includes(twitterUrlMatcher);
  if (hasTweetStatusUrlRef) {
    const refStatusUrlSuffix = cmdText
      .split(twitterUrlMatcher)[1]
      .substring(0, 10);
    let fullRefStatusUrl = urls.find(({ url }) =>
      url.includes(refStatusUrlSuffix)
    ).expanded_url;
    fullRefStatusUrl = fullRefStatusUrl.includes("?")
      ? fullRefStatusUrl.split("?")[0]
      : fullRefStatusUrl;
    resolve(fullRefStatusUrl.split("/status/")[1]);
  }
  refTweetId ? resolve(refTweetId) : resolve(id);
}

async function replyTweet(id, msg) {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`replied to tweet id "${id}" with msg "${msg}"`);
      resolve();
    }, 100);
  });
}
