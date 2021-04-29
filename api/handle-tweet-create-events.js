module.exports = async function handleTweetCreateEvents(payload, res) {
  const validMentions = payload.tweet_create_events
    .filter((tweet) => {
      // ignore retweets, but accept quotes
      if (tweet.retweeted_status && !tweet.is_quote_status) {
        return false;
      }
      // ignore tweets by self
      if (tweet.user.screen_name === process.env.PICKATRANDOM_SCREEN_NAME) {
        return false;
      }
      return true;
    })
    .map((tweet) => {
      return {
        created_at: tweet.created_at,
        id_str: tweet.id_str,
        in_reply_to_status_id: tweet.in_reply_to_status_id,
        user_screen_name: tweet.user.screen_name,
        user_id_str: tweet.user.id_str,
        text: tweet.extended_tweet.full_text ? tweet.extended_tweet.full_text : tweet.text,
        urls: tweet.entities.urls,
        extended_tweet: tweet.extended_tweet
      };
    });
  console.log(JSON.stringify(validMentions, null, 4));
  return;
};
