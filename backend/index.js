const express = require('express');
const connectDB = require('./db');
require('dotenv').config();

connectDB();


const app = express();

app.get('/api', (req, res) => {
  res.json({ message: 'Hello from the backend!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});