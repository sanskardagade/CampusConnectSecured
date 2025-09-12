const { neon } = require("@neondatabase/serverless");
const path = require('path');
require("dotenv").config({ path: path.join(__dirname, '../.env') });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL missing");
}

const sql = neon(process.env.DATABASE_URL, {
  fetchOptions: {
    // Increase timeout to 30 seconds
    timeout: 60000,
  },
  // Enable connection pooling
  pool: {
    max: 10,
    idleTimeoutMillis: 30000,
  }
});

module.exports = sql;