import network, {Encryption} from "socket:network";
import application from 'socket:application';
import {DB} from "./database/index.js";
import WebViewer from '@pdftron/webviewer';

const pdfTronElement = document.getElementById('pdf');

try {
    WebViewer(
        {
            path: '/public',
            initialDoc:
                'https://pdftron.s3.amazonaws.com/downloads/pl/demo-annotated.pdf',
            // licenseKey: 'I Do Recall, Inc. (idorecall.com):OEM:I Do Recall::B+:AMS(20240814):E3B5C5330477760A0360B13AC98253786F613FCD1ED3B57B7C54961B34042CFE9153BEF5C7',
            // webviewerServerURL: 'https://webviewer-test.idorecall.com'
        },
        pdfTronElement
    ).then(instance => {
        console.log('=then=')
        onload(instance)
    })
} catch (e) {
    console.log(e);
}

function onload(instance) {
    const {documentViewer, annotationManager, Annotations} = instance.Core;

    documentViewer.addEventListener('documentLoaded', () => {
        const rectangleAnnot = new Annotations.RectangleAnnotation({
            PageNumber: 1,
            // values are in page coordinates with (0, 0) in the top left
            X: 100,
            Y: 150,
            Width: 200,
            Height: 50,
            Author: annotationManager.getCurrentUser(),
        });

        annotationManager.addAnnotation(rectangleAnnot);
        // need to draw the annotation otherwise it won't show up until the page is refreshed
        annotationManager.redrawAnnotation(rectangleAnnot);
    });
}

// init database
const database = new DB();
await database.initDatabase();

// handle user
const id = 'my_awesome_id';
let peerId;
let signingKeys;
let userName;
let user = await database.getUser(id);
if (user) {
    peerId = user.get('peerId');
    signingKeys = await Encryption.createKeyPair(peerId);
    userName = user.get('name');
}
console.log('User exists ->', !!user);
if (!user) {
    console.log('=NO USER=')
    peerId = await Encryption.createId();
    signingKeys = await Encryption.createKeyPair(peerId);
    const userData = {
        id,
        name: 'Lupa',
        peerId,
    };
    await database.createUser(userData);
    userName = userData.name;
    user = userData;
}
console.log('User exists2 ->', !!user);

// for connection with backend
await application.backend.open();
const currentWindow = await application.getCurrentWindow()

//
// Create (or read from storage) a clusterID and a symmetrical/shared key.
//
const clusterId = await Encryption.createClusterId('IDR-TEST-4')
const sharedKey = await Encryption.createSharedKey('IDR-TEST-4')

console.log(peerId);

//
// Create a socket that can send a receive network events. The clusterId
// helps to find other peers and be found by other peers.
//
const socket = await network({
    peerId,
    clusterId,
    signingKeys,
    userName,
})

//
// Create a subcluster (a partition within your cluster)
//
const subCluster = await socket.subcluster({sharedKey})

//
// A published message on this subcluster has arrived!
//
subCluster.on('message', (value, packet) => {
    if (!packet.verified) {
        return
    } // gtfoa
    if (packet.index !== -1) {
        console.log('packet.index !== -1');
        return
    } // not interested
    try {
        value = JSON.parse(value)
    } catch {
        console.log('JSON.parse(value)');
        return
    }
    console.log('subCluster.on(\'message\'', value);
    const newDiv = document.createElement("div")
    newDiv.innerText = `${value.userName}: ${value.text}`;
    document.getElementById('list').append(newDiv);
});

//
// A message will be published into this subcluster
//
document.getElementById('send').addEventListener('click', async event => {
    const input = document.getElementById('input');
    const text = input.value;
    console.log('=send', text);

    subCluster.emit('message', {text, userName})

    const newDiv = document.createElement("div")
    newDiv.innerText = `${userName}: ${text}`;
    document.getElementById('list').append(newDiv);

    await currentWindow.send({event: 'createMessage', backend: true, value: {text, peerId, userName}});
    currentWindow.on('createMessageDone', async (event) => {
        console.log('INDEX => createMessageDone');
        await database.insertMessage(event.detail);
    })
});

document.getElementById('clear').addEventListener('click', async event => {
    const messagesRaw = await database.getAllMessages();
    const messages = messagesRaw.map(messageRaw => {
        return messageRaw.toJSON();
    })
    console.log(messages);

    const list = document.getElementById('list');
    list.innerHTML = '';
    console.log('=Cleared=');
});

//
// Another peer from this subcluster has directly connected to you.
//
subCluster.on('#join', peer => {
    console.log('=JOIN=');
    if (peer.peerId === 'a7922b5c818d40ed8836fec2a883bdf46a4f71b5069065d78ecf724cbcf93765') {
        console.dir(peer);
    }
});
