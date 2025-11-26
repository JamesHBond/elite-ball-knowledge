const express = require('express');
const path = require('path');
const { Client } = require('pg'); // Postgres client

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// Simple health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Database test route
app.get('/db-test', async (req, res) => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    // Render usually requires SSL for external connections
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    const result = await client.query('SELECT NOW() AS now');
    res.json({ ok: true, time: result.rows[0].now });
  } catch (err) {
    console.error('DB test error:', err);
    res.status(500).json({ ok: false, error: err.message });
  } finally {
    await client.end();
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});