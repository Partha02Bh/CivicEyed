const jwt = require("jsonwebtoken");
require("dotenv").config();

const payload = {
  id: "12345",        // replace with a real user id from your DB
  role: "citizen",    // or "admin"
};

const token = jwt.sign(payload, process.env.JWT_PASSWORD, { expiresIn: "1d" });

console.log("Generated JWT:\n");
console.log(token);
