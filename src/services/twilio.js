const twilio = require('twilio');

// Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

class TwilioService {
  // Send SMS
  static async sendSMS(to, body, from) {
    try {
      const message = await client.messages.create({
        body,
        from: from || process.env.TWILIO_PHONE_NUMBER,
        to
      });
      console.log('SMS sent:', message.sid);
      return message;
    } catch (error) {
      console.error('SMS send error:', error);
      throw error;
    }
  }
  
  // Make voice call with TTS
  static async makeCall(to, message, from) {
    try {
      const call = await client.calls.create({
        twiml: `<Response><Say>${message}</Say></Response>`,
        from: from || process.env.TWILIO_PHONE_NUMBER,
        to
      });
      console.log('Call initiated:', call.sid);
      return call;
    } catch (error) {
      console.error('Call error:', error);
      throw error;
    }
  }
  
  // Buy phone number for new assistant
  static async buyPhoneNumber(areaCode = '555') {
    try {
      const numbers = await client.availablePhoneNumbers('US')
        .local
        .list({ areaCode, limit: 1 });
      
      if (numbers.length === 0) {
        throw new Error('No phone numbers available');
      }
      
      const number = await client.incomingPhoneNumbers.create({
        phoneNumber: numbers[0].phoneNumber,
        smsUrl: `${process.env.API_URL}/webhooks/twilio/sms`,
        voiceUrl: `${process.env.API_URL}/webhooks/twilio/voice`
      });
      
      console.log('Phone number purchased:', number.phoneNumber);
      return number.phoneNumber;
    } catch (error) {
      console.error('Buy number error:', error);
      throw error;
    }
  }
  
  // Parse incoming webhook
  static parseWebhook(body) {
    return {
      from: body.From,
      to: body.To,
      body: body.Body,
      messageSid: body.MessageSid,
      callSid: body.CallSid,
      type: body.CallSid ? 'voice' : 'sms'
    };
  }
}

module.exports = TwilioService;
