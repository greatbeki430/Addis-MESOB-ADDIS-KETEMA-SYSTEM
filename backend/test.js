const mongoose = require('mongoose');

const uri = process.env.MONGO_URI || 'mongodb://greatbekele_db_user:bgbggreat@edutrackultimate.iirm8og.mongodb.net:27017/acha_forum?retryWrites=true&w=majority&authSource=admin';

console.log('🔍 Testing MongoDB Atlas connection...');
console.log('📝 Connection type: Standard (mongodb://)');

mongoose.connect(uri, {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
})
.then(() => {
  console.log('✅ CONNECTED SUCCESSFULLY!');
  console.log('📀 Database name:', mongoose.connection.db.databaseName);
  console.log('🔗 Host:', mongoose.connection.host);
  process.exit(0);
})
.catch(err => {
  console.error('❌ Connection failed:', err.message);
  process.exit(1);
});
