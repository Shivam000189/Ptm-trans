const express = require('express');
const connectDB = require('./src/config/db');
const authUser = require('./src/routes/auth.routes');
const accountRoutes = require('./src/routes/account');
require('dotenv').config();
const cors = require('cors');

connectDB();
const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());


app.use(express.json());

app.use('/api/auth', authUser);
app.use('/api/account', accountRoutes);


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});