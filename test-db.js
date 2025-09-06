import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'eims',
  password: 'postgres',
  port: 5432,
});

client.connect()
  .then(() => {
    console.log("✅ Connected to PostgreSQL");
    return client.query('SELECT NOW()');
  })
  .then(res => {
    console.log("⏰ Server time:", res.rows[0]);
  })
  .catch(err => {
    console.error("❌ Connection error", err);
  })
  .finally(() => client.end());
