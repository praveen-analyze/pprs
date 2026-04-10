require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testKey() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
    const result = await model.generateContent("Say hello");
    console.log("API Key and model are valid!");
    console.log("Response:", result.response.text());
  } catch (error) {
    console.error("Error:", error.message);
  }
}

testKey();