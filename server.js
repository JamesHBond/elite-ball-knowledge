const express = require('express');
const path = require('path');
const { Pool } = require('pg'); // Use Pool for repeated queries

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Serve static files from "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// Database connection pool (reused for all queries)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Keep your SSL behavior similar to what you had before
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
});

// Simple health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Database test route
app.get('/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() AS now');
    res.json({ ok: true, time: result.rows[0].now });
  } catch (err) {
    console.error('DB test error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ===============================
// 🔥 Random question by category
// ===============================
app.get('/api/questions/random', async (req, res) => {
  try {
    const category = (req.query.category || 'NFL').toUpperCase();
    const allowed = ['NFL', 'NBA', 'MLB', 'CFB'];

    if (!allowed.includes(category)) {
      return res.status(400).json({ ok: false, error: 'Invalid category' });
    }

    const result = await pool.query(
      `
      SELECT id, category, question_text,
             option_a, option_b, option_c, option_d, correct_option
      FROM quiz_questions
      WHERE category = $1
      ORDER BY RANDOM()
      LIMIT 1;
      `,
      [category]
    );

    if (result.rows.length === 0) {
      return res.json({
        ok: false,
        error: 'No questions exist for this category yet.'
      });
    }

    res.json({ ok: true, question: result.rows[0] });
  } catch (err) {
    console.error('Random question API Error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
