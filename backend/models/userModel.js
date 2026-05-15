const { mysqlPool } = require("../congif/mySqlConnection");

const createUser = async (fullName, email, hashedPassword, role) => {
    const query = `
      INSERT INTO users 
      (full_name, email, password, role)
      VALUES (?, ?, ?, ?)
    `;
  
    const [result] = await mysqlPool.execute(query, [
      fullName,
      email,
      hashedPassword,
      role,
    ]);
  
    return result;
  };


  const getUserByEmail = async (email) => {
    const query = `
      SELECT * FROM users WHERE email = ?
    `;
  
    const [rows] = await mysqlPool.execute(query, [email]);
  
    return rows[0];
  };


  module.exports = {
    createUser,
    getUserByEmail,
  };