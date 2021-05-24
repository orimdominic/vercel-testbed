const {allowCors}  = require("../allow-cors")
const getProfiles = require("../get-profiles.js")

const profiles = async (req, res) => {
  const method = req.method.toLowerCase();
  switch (method) {
    case "get":
      const profiles =   getProfiles();
      return res.status(200).json({
        records: {
          profiles
        },
        status: "success",
        size: profiles.length
      })
    default:
      res.status(405).send();
      break;
  }
};

module.exports = allowCors(profiles)