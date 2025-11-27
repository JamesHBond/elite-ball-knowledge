const express = require('express');
const path = require('path');
const { Client } = require('pg'); // Postgres client

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

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

// Get a random question for a given category
app.get('/api/questions/random', async (req, res) => {
  const category = req.query.category || 'NFL';

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();

    const result = await client.query(
      `SELECT id,
              category,
              question_text,
              option_a,
              option_b,
              option_c,
              option_d,
              correct_option              -- ⬅ add this
         FROM quiz_questions
        WHERE category = $1
     ORDER BY RANDOM()
        LIMIT 1`,
      [category.toUpperCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, error: 'No questions for this category yet.' });
    }

    // sends correct_option to the frontend as well
    res.json({ ok: true, question: result.rows[0] });
  } catch (err) {
    console.error('Random question error:', err);
    res.status(500).json({ ok: false, error: err.message });
  } finally {
    await client.end();
  }
});

