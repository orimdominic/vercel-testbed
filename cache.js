const {Tedis} = require ("tedis")
const dotenv = require("dotenv")

dotenv.config()

const cache = new Tedis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD
});

cache.set("hello", "world!")
.then(console.log)
.catch(console.error)
.finally(()=> process.exit(1))


module.exports = {cache}