const express = require('express');
const router = express.Router();
const TwilioService = require('../../services/twilio');
const { query } = require('../../db/connection');

// Incoming SMS webhook
router.post('/sms', async (req, res) => {
  try {
    const { from, to, body } = TwilioService.parseWebhook(req.body);
    
    // Find which assistant this number belongs to
    const assistantResult = await query(
      'SELECT * FROM users WHERE assistant_phone = $1',
      [to]
    );
    
    if (assistantResult.rows.length === 0) {
      // Unknown number
      return res.send('<Response><Message>Unknown assistant.</Message></Response>');
    }
    
    const assistant = assistantResult.rows[0];
    
    // Log the message
    await query(
      `INSERT INTO messages (id, user_id, channel, direction, from_addr, to_addr, content, created_at)
       VALUES (gen_random_uuid(), $1, 'sms', 'inbound', $2, $3, $4, NOW())`,
      [assistant.id, from, to, body]
    );
    
    // TODO: Process with AI and respond
    const response = `Hello! I'm ${assistant.name}'s AI assistant. I received: "${body}"`;
    
    // Send response
    await TwilioService.sendSMS(from, response, to);
    
    res.send('<Response><Message>' + response + '</Message></Response>');
  } catch (error) {
    console.error('SMS webhook error:', error);
    res.status(500).send('Error');
  }
});

// Incoming voice call webhook
router.post('/voice', async (req, res) => {
  try {
    const { from, to } = TwilioService.parseWebhook(req.body);
    
    // Find assistant
    const assistantResult = await query(
      'SELECT * FROM users WHERE assistant_phone = $1',
      [to]
    );
    
    let response;
    if (assistantResult.rows.length === 0) {
      response = "Hello, you've reached an unknown number.";
    } else {
      const assistant = assistantResult.rows[0];
      response = `Hello! You've reached ${assistant.name}'s AI assistant. Please leave a message or text me.`;
    }
    
    const twiml = `
      <Response>
        <Say>${response}</Say>
        <Record maxLength="300" />
      </Response>
    `;
    
    res.type('text/xml');
    res.send(twiml);
  } catch (error) {
    console.error('Voice webhook error:', error);
    res.status(500).send('Error');
  }
});

module.exports = router;
