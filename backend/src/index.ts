import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_, res) => {
    res.json({ status: "ok" });
});

app.listen(3000, "0.0.0.0", () => {
    console.log("Server running on port 3000");
});