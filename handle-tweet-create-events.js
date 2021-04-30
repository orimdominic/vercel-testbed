module.exports = async function handleTweetCreateEvents(payload, res) {
  const realMentions = payload.tweet_create_events.filter(isRealMention);
  if (!realMentions.length) {
    return res.status(200).send();
  }
  const mentions = realMentions
    .map(setMentionObject)
    .map(setMentionCommandText)
    .filter(({ cmdText }) => cmdText.length);
  if (!mentions.length) {
    return res.status(200).send();
  }
  const [cancelSelectionTweets, makeSelectionTweets] = [
    mentions.filter(isCancellationTweet(true)),
    mentions.filter(isCancellationTweet(false)),
  ];
  if (cancelSelectionTweets.length) {
    for (const tweet of cancelSelectionTweets) {
      try {
        await cancleSelection(tweet);
      } catch (e) {
        console.error(`cancellation request for "${tweet.id}" failed`);
        console.error(JSON.stringify(e));
      }
    }
  }
  if (makeSelectionTweets.length) {
    for (const tweet of makeSelectionTweets) {
      try {
        const engagementCount = await handleEngagementCount(tweet);
        if(!engagementCount) res.status(200).send()
      } catch (e) {
        console.error(`make selection request for "${tweet.id}" failed`);
        console.error(JSON.stringify(e));
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

function isCancellationTweet(isCancel) {
  return ({ cmdText }) =>
    isCancel ? cmdText.startsWith("cancel") : !cmdText.startsWith("cancel");
}

async function cancleSelection(tweet) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      console.log(`handled selection cancellation for "${tweet.id}"`);
      resolve();
    }, 100);
  });
}

async function getCount({ id, cmdText }) {
  const [countStr] = cmdText.split(" ")[0];
  const count = parseInt(countStr, 10);
  if (Number.isNaN(count)) {
    const msg = `😟 I wasn't able to find the number of engagements you want.
    Can you try again with the format "@PickAtRandom N .."? N being the number of engagements.`;
    await replyTweet(id, msg);
    return;
  }
  if (count < 1) {
    const msg = `Nice trick, but no one can randomly pick any number of engagements less than 1 😉`;
    await replyTweet(id, msg);
    return ;
  }
  return count;
}

async function replyTweet(id, msg) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      console.log(`replied to "${id}" with msg "${msg}"`);
      resolve();
    }, 100);
  });
}
