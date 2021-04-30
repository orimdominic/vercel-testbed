module.exports = async function handleTweetCreateEvents(payload, res) {
  const validMentions = getValidMentions(payload.tweet_create_events);
  const mentions = setMentionObjects(validMentions);
  console.log(JSON.stringify(mentions, null, 4));
  return;
};

function getValidMentions(tweetEvents) {
  return tweetEvents.filter((tweet) => {
    // ignore retweets, but accept quotes
    if (tweet.retweeted_status && !tweet.is_quote_status) {
      return false;
    }
    // ignore tweets by self
    if (tweet.user.screen_name === process.env.PICKATRANDOM_SCREEN_NAME) {
      return false;
    }
    return true;
  });
}

function setMentionObjects(validMentions) {
  return validMentions.map((tweet) => {
    return {
      created_at: tweet.created_at,
      id_str: tweet.id_str,
      in_reply_to_status_id: tweet.in_reply_to_status_id,
      author_name: tweet.user.screen_name,
      author_id: tweet.user.id_str,
      text: tweet.truncated
        ? tweet.extended_tweet.full_text
        : tweet.text,
      urls: tweet.entities.urls,
    };
  });
}
