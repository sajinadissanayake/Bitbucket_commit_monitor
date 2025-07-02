require("dotenv").config();
const axios = require("axios");

const sendWhatsAppMessage = async (to, message) => {
    try {
        // Fix the API URL by ensuring it has the https:// prefix and the proper endpoint
        const baseUrl = process.env.INFOBIP_BASE_URL.startsWith('https://') 
            ? process.env.INFOBIP_BASE_URL 
            : `https://${process.env.INFOBIP_BASE_URL}`;
            
        const response = await axios.post(
            `${baseUrl}/whatsapp/1/message/text`,
            {
                from: process.env.WHATSAPP_SENDER,
                to: to,
                content: {
                    text: message
                }
            },
            {
                headers: {
                    "Authorization": `App ${process.env.INFOBIP_API_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );

        console.log("Message sent successfully:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error sending message:", error.response ? error.response.data : error.message);
        throw error;
    }
};

module.exports = sendWhatsAppMessage;