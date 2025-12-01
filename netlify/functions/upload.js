const axios = require("axios");
const FormData = require("form-data");

exports.handler = async function (event, context) {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    // Ensure Netlify does NOT mangle base64 body
    if (event.isBase64Encoded) {
      event.body = Buffer.from(event.body, "base64").toString("utf8");
    }

    const body = JSON.parse(event.body || "{}");
    const { fileName, contentType, data } = body;

    if (!data || !fileName) {
      return { statusCode: 400, body: "Missing file data" };
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      return { statusCode: 500, body: "Missing Cloudinary config" };
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(data, "base64");

    const form = new FormData();
    form.append("file", buffer, {
      filename: fileName,
      contentType: contentType || "application/octet-stream",
    });
    form.append("upload_preset", uploadPreset);

    const url = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;

    const resp = await axios.post(url, form, {
      headers: form.getHeaders(),
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: resp.data.secure_url }),
    };
  } catch (err) {
    console.error("upload error", err?.response?.data || err);
    return { statusCode: 500, body: "Upload failed" };
  }
};
