
import express from "express";
import fetch from "node-fetch";
import path from "path";
import mongoose from "mongoose";
import { fileURLToPath } from "url";

const app = express();
const port = 3000;
const API_KEY = "sk-proj-yzizWIG6tDYKnXqvOJGOT3BlbkFJcSMSaJjogeIWACFtwI8l";
const API_URL = "https://api.openai.com/v1/chat/completions";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

mongoose.connect('mongodb+srv://rishikrishjr:5tQDGc4MG09o0Je0@cluster0.hryrh.mongodb.net/crud?retryWrites=true&w=majority&appName=Cluster0');

const TaskSchema = new mongoose.Schema({
  taskName: String,
  taskDescription: String,
  priority: String
});

const TaskModel = mongoose.model('tasks', TaskSchema);

app.post("/generate", async (req, res) => {
    const prompt = req.body.prompt;

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${API_KEY}`,
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [{
                    role: "system",
                    content: "Users at a company provide feedback for each other. You will be provided one user’s feedback summary. You must analyze the feedback and suggest tasks for the user. Return output as a JSON array, where each object in the array has the following keys: taskName, taskDescription, priority. If you think there is no task required, you can return an empty array. Options for priority: LOW, MEDIUM, HIGH, URGENT. Return plain JSON, Don't use markdown syntax"
                },
                {
                    role: "user",
                    content: prompt
                }],
            }),
        });

        const data = await response.json();
        const tasks = JSON.parse(data.choices[0].message.content);

        await TaskModel.insertMany(tasks);

        res.json({ content: tasks });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Error occurred while generating." });
    }
});

app.get("/tasks", async (req, res) => {
    try {
        const tasks = await TaskModel.find();
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching tasks.' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
