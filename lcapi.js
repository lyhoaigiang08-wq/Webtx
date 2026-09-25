const express = require("express");
const axios = require("axios");
const path = require("path");

const app = express();
const port = Number(process.env.PORT || 9898);

// Cho phép index.html gọi API khi chạy qua server này.
app.use((req, res, next) => { res.setHeader("Access-Control-Allow-Origin", "*"); res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS"); res.setHeader("Access-Control-Allow-Headers", "Content-Type"); next(); });
app.use(express.static(__dirname));

function getCurrentTimeUTC7() {
  const now = new Date();
  const offset = 7;
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const localTime = new Date(utc + (3600000 * offset));

  const day = String(localTime.getDate()).padStart(2, "0");
  const month = String(localTime.getMonth() + 1).padStart(2, "0");
  const year = localTime.getFullYear();
  const hours = String(localTime.getHours()).padStart(2, "0");
  const minutes = String(localTime.getMinutes()).padStart(2, "0");
  const seconds = String(localTime.getSeconds()).padStart(2, "0");

  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds} UTC+7`;
}

app.get("/api/lcmd5", async (req, res) => {
  try {
    const response = await axios.get(
      "https://wtxmd52.tele68.com/v1/txmd5/sessions",
      { timeout: 10000 }
    );

    const data = response.data;
    let sessions = data.list || data;

    if (!Array.isArray(sessions) || sessions.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không có dữ liệu"
      });
    }

    sessions.sort((a, b) => Number(b.id) - Number(a.id));

    const latest = sessions[0];

    const ketQua = latest.resultTruyenThong
      ? String(latest.resultTruyenThong).toLowerCase()
      : "";

    const phien = latest.id || latest._id;
    const tong = latest.point || 0;
    const xucXac = Array.isArray(latest.dices)
      ? latest.dices
      : [0, 0, 0];

    res.json({
      success: true,
      data: {
        ket_qua: ketQua,
        phien,
        thoi_gian: getCurrentTimeUTC7(),
        tong,
        xuc_xac_1: xucXac[0] || 0,
        xuc_xac_2: xucXac[1] || 0,
        xuc_xac_3: xucXac[2] || 0
      }
    });
  } catch (error) {
    console.error("Lỗi API:", error.message);

    res.status(500).json({
      success: false,
      message: "Không lấy được dữ liệu từ API nguồn"
    });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(port, () => {
  console.log(`AI Tài Xỉu chạy tại http://localhost:${port}`);
});