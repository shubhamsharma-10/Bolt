import express from 'express';
import { prismaClient } from '@repo/db/client';

const app = express();
app.use(express.json());
const port = 4000;  

app.post('/create', async(req, res) => {
    const { name, email, password } = req.body;
    const user = await prismaClient.user.create({
        data: {
            name,
            email,
            password,
        },
    });
    console.log("User created: ", user);
    res.json({
        msg: "User created",
        user
    });
}
);

app.post('/project', async(req, res) => {
    const { description, userId  } = req.body;
    const newProject = await prismaClient.project.create({
        data: {
            description,
            userId
        },
    });
    console.log("Project created: ", newProject);
    res.json({
        msg: "User created",
        newProject
    });
});

app.post('/prompt', async(req, res) => {
    const { content, type, projectId } = req.body;
    const newPrompt = await prismaClient.prompt.create({
        data: {
            content,
            type,
            projectId
        }
    });
    console.log("Prompt created: ", newPrompt);
    res.json({
        msg: "Prompt created",
        newPrompt
    });
});

app.listen(port, () => { 
  console.log(`Example app listening on port ${port}`);
});


