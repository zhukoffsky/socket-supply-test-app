import socket from '@socketsupply/socket-node'

socket.on('createMessage', async (value) => {
    console.log('BACKEND => createMessage');

    const data = JSON.parse(value);
    const message = {
        id: (+new Date()).toString(),
        peerId: data.peerId,
        sender: data.userName,
        message: data.text,
        timestamp: new Date().toISOString()
    };
    await socket.send({
        window: 0,
        event: 'createMessageDone',
        value: message,
    })
})

socket.on('getMessages', async (value) => {
    console.log('BACKEND => getMessages');

    // const jsonMessages = messages.map(message => {
    //     return message.toJSON();
    // });
    // console.log(jsonMessages);
    await socket.send({
        window: 0,
        event: 'getMessagesDone',
        value: 'getMessagesDone',
    })
})
