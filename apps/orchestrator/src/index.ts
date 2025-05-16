import express from 'express';
import { AutoScalingClient, SetDesiredCapacityCommand, DescribeAutoScalingGroupsCommand, DescribeAutoScalingInstancesCommand } from "@aws-sdk/client-auto-scaling";
import { EC2Client, DescribeInstancesCommand} from "@aws-sdk/client-ec2"
import dotenv from "dotenv";
dotenv.config({ path: './.env' });

const app = express();

const client = new AutoScalingClient({ 
    region: "eu-north-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!  
    }
});

const ec2Client = new EC2Client({ 
    region: "eu-north-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!  
    }
}); 


type Machine = {
    ip: string;
    isused: boolean;
    projectId: string;
}

let All_Machines:Machine[] = [];

async function refreshMachines() {
    const command = new DescribeAutoScalingInstancesCommand({});
    const response = await client.send(command);

    // 'ans' might contain undefineds
    const ans = response.AutoScalingInstances?.map((instance) => instance.InstanceId);

    // ✅ Filter out undefineds
    const instanceIds = ans?.filter((id): id is string => typeof id === "string");

    console.log(instanceIds);

    const ec2Command = new DescribeInstancesCommand({
        InstanceIds: instanceIds?.length ? instanceIds : undefined,  // undefined if empty
    });

    const ec2Response = await ec2Client.send(ec2Command);
    //@ts-ignore
    console.log(ec2Response.Reservations[0]?.Instances);
    //@ts-ignore
    console.log(ec2Response.Reservations[1]?.Instances[0]?.PublicIpAddress);

}
refreshMachines();

// setInterval(() => {
//     refreshMachines();
// }, 10*1000);

app.get("/:projectId", (req, res) => {
    
    let idleMachine = All_Machines.find((machine)  => machine.isused == false);
    if(!idleMachine){
       console.log("No idle machine found");
       return res.status(500).send("No idle machine found");
    }

    idleMachine.isused = true;
    const command = new SetDesiredCapacityCommand({
        AutoScalingGroupName: "vscode-asg",
        DesiredCapacity: All_Machines.length + (5 - All_Machines.filter((machine) => machine.isused == false).length)
    })

    client.send(command);
    res.json({
        ip: idleMachine.ip
    });
    
})

app.listen(3000, () => {
    console.log("Server is running on port 3000");  
});




// const command = new DescribeAutoScalingGroupsCommand({
//     AutoScalingGroupNames: ["vscode-asg"]
// });

// const command2 = new SetDesiredCapacityCommand({
//     AutoScalingGroupName: "vscode-asg",
//     DesiredCapacity: 2
// });

// async function run() {
//     try {
//         const response = await client.send(command2);
//         console.log(response);
//     } catch (error) {
//         console.error(error);
//     }
// }

// run();