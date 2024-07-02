import Docker from 'dockerode';
import express from 'express';

const docker = new Docker();

async function startOne(){

    // Create a new container
    const newContainer = await docker.createContainer({
        Image: 'hello-world',
        name: 'hello-world'
    });
    console.log(newContainer);


    // list all containers
    const container = await docker.listContainers({
        all: true
    });
    console.log(container)


    // delete all containers 
    container.forEach(async (container) => {
        await docker.getContainer(container.Id).remove({
            force: true
        }, (err, data) => {
            if (err) {
                console.log(err);
            } else {
                console.log(data);
            }
        });
    });

}
// startOne();

// API's Using Express =>

interface newContainer {
    image: string;
    name: string;
    port: string;
}

const PORT_TO_CONTAINER: any = {} // { "8000": "containerId" }
const CONTAINER_TO_PORT: any = {} // { "containerId": "8000" }

async function startTwo(){
    const app = express();
    app.use(express.json());
    const PORT = 3000;

    app.get("/", async (req, res)=>{
        await res.json({
            msg: "Hello From Docker"
        });
    })
    
    // List all containers
    app.get('/containers', async (req, res) => {
        const containers = await docker.listContainers({
            all: true
        });
        res.json({
            containers: containers.map(c => ({id: c.Id, name: c.Names[0], image: c.Image}))
        });
    });

    // Create a new container
    app.post('/containers', async (req, res) => {

        try {
            const {image, name}: newContainer = req.body;
            await docker.pull(image);

            const availablePort = ( () => {
                for(let i=8000; i<=9000; i++){
                    if (!PORT_TO_CONTAINER[i]) continue;
                    return `${i}`;
                }
            })();
            if (!availablePort) throw new Error("No Port Available");

            const newContainer = await docker.createContainer({
                Image: image,
                name: name,
                Cmd: ["sh"],
                AttachStdout: true,
                Tty: true,
                HostConfig: {
                    PortBindings: {
                        "8000/tcp": [ { HostPort: availablePort } ]
                    }
                },
            });
            await newContainer.start();

            PORT_TO_CONTAINER[availablePort] = newContainer.id;
            CONTAINER_TO_PORT[newContainer.id] = availablePort;

            await res.json({
                msg: "Container Created",
                id: newContainer.id,
            });
        } catch (error: any) {
            res.json({
                err: error.message
            });
        }
    });

    // Delete all containers
    app.delete('/containers', async (req, res) => {
        try {
            const containers = await docker.listContainers({
                all: true
            });
            containers.forEach(async (container) => {
                await docker.getContainer(container.Id).remove({
                    force: true
                });
            });
            res.json({
                msg: "All Containers Deleted",
                deleted: containers.map(c => c.Names[0])
            });
        } 
        catch (error: any) {
            res.json({
                err: error.message
            });
        }
    });


    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

startTwo();