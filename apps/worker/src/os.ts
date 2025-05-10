import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { writeFile } from 'fs/promises';
import { spawnSync } from 'child_process';
import path from 'path';

const BASE_WORKER_DIR = path.join(__dirname, '..', '..', 'code-server', 'temp', 'worker');
console.log(`Base worker directory: ${BASE_WORKER_DIR}`);

// Ensure directory exists
if (!existsSync(BASE_WORKER_DIR)) {
    mkdirSync(BASE_WORKER_DIR, { recursive: true });
    console.log(`Created directory: ${BASE_WORKER_DIR}`);    
    writeFileSync(BASE_WORKER_DIR + '/.placeholder', '');  // create empty file
}

// Handle file update
export async function onFileUpdate(filePath: string, fileContent: string) {
    const fullPath = path.join(BASE_WORKER_DIR, filePath);
    const dir = path.dirname(fullPath);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    console.log(`Creating file: ${fullPath}`);
    console.log(`File content: ${fileContent}`);
     await writeFile(fullPath, fileContent);  
}

// Handle shell command
export async function onShellCommand(shellCommand: string) {
    const commands = shellCommand.split("&&");
    for (const command of commands) {
        console.log(`Running command: ${command}`);

        const args = command.trim().split(" ").filter(arg => arg !== ""); // Remove any empty strings from the array
        
        // Ensure args[0] (command) exists before passing to spawnSync
        if (args[0]) {
            let result
            try {                
                 result = await spawnSync(args[0], args.slice(1), {
                    cwd: BASE_WORKER_DIR,
                    encoding: 'utf-8',
                    shell: true
                });    
                console.log(result.stdout);
                
            } catch (error) {
                console.error(result?.stderr)  
            };
        } else {
            console.error("Invalid command: command is empty.");
        }
    }
}