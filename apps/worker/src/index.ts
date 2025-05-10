import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions"; 
import { systemPrompt } from "./systemPrompts";
import { ArtifactProcessor } from "./parser";
import { onFileUpdate, onShellCommand } from "./os";
import express from "express";
import {prismaClient} from "@repo/db/client";
import dotenv from "dotenv";
dotenv.config({ path: './.env' });

const app = express();
app.use(express.json());
const port = 3000;

const openai = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
});

app.post("/prompt", async(req, res) => {
    // Check if the request body is empty
  const { content, type, projectId } = req.body;
  const project = await prismaClient.project.findUnique({
      where: {
          id: projectId
      }
  });
  if (!project) {
       res.status(404).json({
          msg: "Project not found"
      });

      return;
  } 
 //Create a new prompt in db
  const newPrompt = await prismaClient.prompt.create({
    data: {
        content,
        type,
        projectId
    }
  });

  //Extract all prompts from db
  const allPrompts = await prismaClient.prompt.findMany({
    where: {  
        projectId: projectId
    },  
    orderBy: {
      createdAt: "asc"
    }       
  }); 

  // all prompts in an array
  const allPromptContent: ChatCompletionMessageParam[] = allPrompts.map((prompt) => {
    if (prompt.type === "USER") {
      return {
        role: "user",
        content: prompt.content,
      } as const; // 👈 Important
    } else {
      return {
        role: "assistant",
        content: prompt.content,
      } as const;
    }
  });

  console.log("allPromptContent: ", allPromptContent);
  console.log("allPrompts: ", allPrompts);
  
  // Add system prompt to the beginning of the array
  const allPromptContents: ChatCompletionMessageParam[]  = [
    {
      role: "system",
      content: systemPrompt
    },
    ...allPromptContent
  ];

    // ArtifactProcessor class instance
  let artifactProcessor = new ArtifactProcessor(
    "",
    (filePath, fileContent) => onFileUpdate(filePath, fileContent),
    (shellCommand) => onShellCommand(shellCommand)
  );
  
  let artifact = "";

  // talk to llm and get the artifact
  async function main() {
    const completion = await openai.chat.completions.create({
        model: 'deepseek/deepseek-r1',
        messages: allPromptContents,
        stream: false
    })
    
    // for await (const chunk of completion) {
    //   // process.stdout.write(chunk.choices[0]?.delta?.content || '');
    //   const text = chunk.choices[0]?.delta?.content || ''; // Ensure text exists
    //   console.log("Here is the log of text :----", text);
      
    //   artifactProcessor.append(text);
    //   await artifactProcessor.parse();
    //   artifact += text;
    // }  

    const text = completion.choices[0]?.message.content; // Ensure text exists
      if (text) {
      artifactProcessor.append(text);
      await artifactProcessor.parse();
      artifact += text;
      }
   
      console.log("Artifact: ", artifact);
      

    console.log("Done");
    await prismaClient.prompt.create({
      data: {
        content: artifact,
        projectId,
        type: "SYSTEM",
      },
    });
    
    // console.log("Artifact: ", artifact);

  }

  main();
   
  console.log("Prompt created: ", newPrompt);
    
  res.json({
      msg: "Prompt created",
      newPrompt
  });
})

app.listen(port, () => {
  console.log(`app listening at http://localhost:${port}`);
});

