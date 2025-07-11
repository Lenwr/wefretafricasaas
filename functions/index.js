const functions = require("firebase-functions");
const cors = require("cors")({ origin: true });
const twilio = require("twilio");

const accountSid = "AC82f9af0f01c49f512f079fc5364f3628";
const authToken = "dd765a22bac8d8af8cf0b3b1f35cfe61";
const twilioNumber = "+15138224833";
const client = twilio(accountSid, authToken);


exports.sendInvoiceSMS = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const { phoneNumber, message } = req.body;
    if (!phoneNumber || !message) {
      return res.status(400).json({
        success: false,
        error: "Numéro ou message manquant.",
      });
    }

    try {
      const sms = await client.messages.create({
        body: message,
        from: "AARONTRAVEL",
        to: phoneNumber,
      });

      return res.status(200).json({
        success: true,
        sid: sms.sid,
        message: "SMS envoyé avec succès",
      });
    } catch (error) {
      console.error("Erreur Twilio :", error.message);
      return res.status(500).json({
        success: false,
        error: "Erreur lors de l'envoi du SMS",
        details: error.message,
      });
    }
  });
});
