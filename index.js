import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());

app.post("/webhook", async (req, res) => {
  try {
    const event =
      req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (!event) return res.sendStatus(200);

    const userText = event.text;
    const userId = event.from.id;

    const prompt = `
Bạn là tư vấn viên spa tổng hợp cao cấp năm 2026.
Giọng nhẹ nhàng, chuyên nghiệp, không ép mua.
Chỉ tư vấn tối đa 2 liệu trình.
Luôn kết thúc bằng 1 câu hỏi nhẹ.

Câu hỏi khách: "${userText}"
`;

    const gemini = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
      }
    );

    const reply =
      gemini.data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Dạ spa đã nhận được tin nhắn, em tư vấn ngay ạ 🌸";

    await axios.post(
      "https://openapi.zalo.me/v3.0/oa/message/cs",
      {
        recipient: { user_id: userId },
        message: { text: reply },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.ZALO_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(200);
  }
});

app.listen(3000, () => {
  console.log("Zalo Spa Bot is running...");
});
