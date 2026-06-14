const mongose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/paytm";


const connectDB = async () => {
    try{
        
        const conn = await mongose.connect(MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    }catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}

module.exports = connectDB;
