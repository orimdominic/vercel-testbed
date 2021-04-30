const chrono = require("chrono-node");

console.log(
  JSON.stringify(
    chrono.parseDate(
      "last thursday",
      new Date("Fri Apr 30 07:30:06 +0000 2021"),
      {
        forwardDate: true,
      }
    ),
    null,
    4
  )
);

// created_at": "Fri Apr 30 07:30:06 +0000 2021"
