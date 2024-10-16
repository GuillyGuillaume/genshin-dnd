const express = require('express');
const { Pool } = require('pg'); // Import pg
const cors = require('cors');

const app = express();
const PORT = 5000; // Adjust as necessary

// Create a new pool instance with your database configuration
const pool = new Pool({
  user: 'genshin_dnd_db_user',
  host: 'dpg-cs848llumphs73800fh0-a.oregon-postgres.render.com',
  database: 'genshin_dnd_db',
  password: 'VNZqlwacotXND48Jiovx7EURWeVGEdhh',
  port: 5432,
});

// Middleware
app.use(cors());
app.use(express.json());

// Route to get all pins
app.get('/pins', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM pins ORDER BY id ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching pins:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Route to add a new pin
app.post('/pins', async (req, res) => {
  const { lat, lng, iconUrl } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO pins (lat, lng, icon_url) VALUES ($1, $2, $3) RETURNING *',
      [lat, lng, iconUrl]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding pin:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Route to update a pin's location by ID
app.put('/pins/:id', async (req, res) => {
  const pinId = parseInt(req.params.id);
  const { lat, lng } = req.body;

  try {
    const result = await pool.query(
      'UPDATE pins SET lat = $1, lng = $2 WHERE id = $3 RETURNING *',
      [lat, lng, pinId]
    );
    if (result.rows.length === 0) {
      return res.status(404).send('Pin not found');
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error updating pin location:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Route to delete a pin by ID
app.delete('/pins/:id', async (req, res) => {
  const pinId = parseInt(req.params.id);
  
  try {
    const result = await pool.query('DELETE FROM pins WHERE id = $1', [pinId]);
    if (result.rowCount === 0) {
      return res.status(404).send('Pin not found');
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting pin:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
