const mysql = require("mysql2/promise");

const mysqlPool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  });


  const connectMySQL = async () => {
    try {
      const connection = await mysqlPool.getConnection();
  
      console.log("✅ MySQL Connected");
  
      connection.release();
    } catch (error) {
      console.log("❌ MySQL Error:", error.message);
    }
  };
  
  module.exports = {
    mysqlPool,
    connectMySQL,
  };