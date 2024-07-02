import Docker from 'dockerode';

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

startOne();