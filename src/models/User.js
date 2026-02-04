const { query } = require('../db/connection');

class User {
  // Create new user with AI assistant
  static async create({ email, name, phone, assistantConfig = {} }) {
    const sql = `
      INSERT INTO users (id, email, name, phone, assistant_email, assistant_phone, created_at)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW())
      RETURNING *
    `;
    
    const assistantEmail = assistantConfig.email || `assistant-${email.split('@')[0]}@geniinow.com`;
    const assistantPhone = assistantConfig.phone || await generatePhoneNumber();
    
    const result = await query(sql, [email, name, phone, assistantEmail, assistantPhone]);
    return result.rows[0];
  }
  
  // Get user by ID
  static async findById(id) {
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0];
  }
  
  // Get user by email
  static async findByEmail(email) {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  }
  
  // Update communication preferences
  static async updatePreferences(id, prefs) {
    const sql = `
      UPDATE users 
      SET communication_prefs = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    const result = await query(sql, [JSON.stringify(prefs), id]);
    return result.rows[0];
  }
  
  // Connect user's personal accounts
  static async connectAccounts(id, accounts) {
    const sql = `
      UPDATE users 
      SET connected_accounts = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    const result = await query(sql, [JSON.stringify(accounts), id]);
    return result.rows[0];
  }
}

// Helper to generate unique phone for assistant
async function generatePhoneNumber() {
  // In production: integrate with Twilio to buy number
  // For now: return placeholder
  return `+1-555-${Math.floor(1000 + Math.random() * 9000)}`;
}

module.exports = User;
