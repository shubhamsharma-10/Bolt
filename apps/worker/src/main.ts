// import { ArtifactProcessor } from "./parser";

// import { onFileUpdate, onShellCommand } from "./os";

// const artifactProcessor = new ArtifactProcessor("", onFileUpdate, onShellCommand);
// const test  = `<boltArtifact>
//     <boltAction type="file" filePath="src/index.js">
//         console.log("Hello, world!");
//     </boltAction>
//     <boltAction type="shell">
//         npm
//     </boltAction>
// </boltArtifact>`

// let artifact = ``;
// artifactProcessor.append(test);
// (async function() {
//     await artifactProcessor.parse();
//     artifact += artifactProcessor.currentArtifact;
//     console.log("Artifact: ", artifact);
// })();