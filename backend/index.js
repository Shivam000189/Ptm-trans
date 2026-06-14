const express = require('express');
const connectDB = require('./src/config/db');
const registerUser = require('./src/routes/auth.routes');
require('dotenv').config();
const cors = require('cors');

connectDB();
const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());


app.use(express.json());

app.use('/api/auth', registerUser);


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});