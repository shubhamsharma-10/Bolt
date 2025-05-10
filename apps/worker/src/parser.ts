
        export class ArtifactProcessor {
            public currentArtifact: string;
            private onFileContent: (filePath: string, fileContent: string) => void;
            private onShellCommand: (shellCommand: string) => void;

            constructor(currentArtifact: string, onFileContent: (filePath: string, fileContent: string) => void, onShellCommand: (shellCommand: string) => void) {
                this.currentArtifact = currentArtifact;
                this.onFileContent = onFileContent;
                this.onShellCommand = onShellCommand;
            }

            append(artifact: string) {
                this.currentArtifact += artifact;
            }

            async parse() {
                while (true) {
                    const lines = this.currentArtifact.split("\n");
                    const startIndex = lines.findIndex((line) => line.includes("<boltAction type="));
                      const endIndex = lines.findIndex((line, idx) => idx > startIndex && line.includes("</boltAction>"));
            
                    if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) break;
            
                    const actionLines = lines.slice(startIndex, endIndex + 1);
                    const actionLine = lines[startIndex];
                    const typeMatch = actionLine?.match(/type="([^"]+)"/);
                    const filePathMatch = actionLine?.match(/filePath="([^"]+)"/);
                    const actionType = typeMatch?.[1];
                    const content = actionLines.slice(1, -1).join("\n").trim(); // ignore opening and closing tags
            
                    try {
                        if (actionType === "shell") {
                            await this.onShellCommand(content);
                        } else if (actionType === "file" && filePathMatch) {
                            //@ts-ignore
                           await this.onFileContent(filePathMatch[1], content);
                        }
                    } catch (e) {
                        console.error("Error processing action:", e);
                    }
            
                    // Remove the processed block including newlines
                    const before = lines.slice(0, startIndex);
                    const after = lines.slice(endIndex + 1);
                    this.currentArtifact = [...before, ...after].join("\n");
                }
            }
            
            
        }