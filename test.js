import FormData from "form-data";
import fetch from "node-fetch";

const url = "https://room-rental-lemon.vercel.app/api/avatar";

const form = new FormData();
form.append("userId", "bb0fa90c-ce3d-464f-825c-ed62b2d3e37a");

fetch(url, {
  method: "DELETE",
  body: form,
})
  .then((res) => res.json())
  .then((data) => console.log("Result:", data))
  .catch((err) => console.error("Error:", err));

