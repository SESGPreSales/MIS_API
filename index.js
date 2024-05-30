import 'dotenv/config';
<<<<<<< HEAD
import fetch from "node-fetch"
=======
import Net from 'net'
>>>>>>> 1090e79511dfcf8af431f6d497954f630f3ff995

const server = process.env.MIS_SERVER || "localhost";
const port = process.env.MIS_PORT || "7002";
const user = process.env.MIS_USER || "none";
const password = process.env.MIS_PASSWORD || "none";
const deviceId = process.env.DEVICE_ID || "none";
const timeout = process.env.TIMEOUT || 15000;
const deviceIp = process.env.DEVICE_IP || "none";

const authBody = {
    username: user,
    password
};

const devicesBody = {
    ids: [deviceId]
};




// Example HEX codes to be sent to the screens. In this example, the DeviceID 01 has been defined.
const status = [0xAA, 0x0D, 0x01, 0x00, 0x0E]
var statushex = new Uint8Array(status);
const panelonToSend = [0xAA, 0xF9, 0x01, 0x01, 0x01, 0xFC]
var panelonhex = new Uint8Array(panelonToSend);
const paneloffToSend = [0xAA, 0xF9, 0x01, 0x01, 0x00, 0xFB]
var paneloffhex = new Uint8Array(paneloffToSend);
const ecoSensor = [0xAA, 0x50, 0x01, 0x01, 0x00, 0x52]
var ecoSensorhex = new Uint8Array(ecoSensor);

// Ip address of the screen
const host1 = '192.168.10.115'

let onOrOff = 0; //used to check the screen status

//Calls the test every 2 seconds
//setInterval(()=> sendRj(host1, 1515, ecoSensorhex), 2000 )

async function sendRj(host, port, hex) {
    setTimeout(()=> {
        // console.log('closing due to inactivity...')
        obj.destroy()
    }, 1000)

    // console.log('DEBUG : Starting', host, port, hex);

    let obj = new Net.Socket();

    // Listen for data from the server
    obj.on('data', (data) => {

        console.log('Received:', data);
        const buffer = Buffer.from(data)
        const thirdLastByte = buffer[buffer.length - 3];
        const secondLastByte = buffer[buffer.length - 2];
        const toBeDecoded = `${thirdLastByte.toString(16)}${secondLastByte.toString(16)}`
        const dec = parseInt(toBeDecoded,16)

        console.log('Measured LUX at the screen : ',dec)

        obj.destroy(); // Close the connection after receiving the data
        
        return dec
    });

    // Listen for any errors
    obj.on('error', (err) => {
        console.error('Error:', err);
        obj.destroy();
    });

    obj.on('close', () => {
        // console.log('Connection closed');
    });

    obj.connect({ port: port, host: host }, () => {
        console.log(`DEBUG : TCP connection established with the screen ${host}`);

        setTimeout(() => {
            obj.write(hex, (err) => {
                if (err) {
                    console.error('Write error:', err);
                    return;
                }
                console.log('DEBUG : Data written to server');
            });
        }, 100);
    });
}

// console.log(`DEBUG : Will use ${server}:${port} as the URL to fetch for device ${deviceId} every ${timeout}ms`);
const getToken = async () => {
    try {
        // console.log("DEBUG : starting getToken ... ");
        const response = await fetch(`${server}:${port}/MagicInfo/auth`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(authBody)
        });
        if (!response.ok) {
            throw new Error(`Authentication failed: ${response.statusText}`);
        }
        const res = await response.json();
        // console.log("DEBUG : SUCCESS: Token received");
        return res.token;
    } catch (error) {
        console.error(`Error fetching token: ${error.message}`);
        throw error;
    }
};

const getTicket = async (token) => {
    try {
        // console.log(`DEBUG : Starting getTicket call ... with token ${token.slice(0, 25)}[...]`);
        const response = await fetch(`${server}:${port}/MagicInfo/restapi/v2.0/rms/devices/current-display-info/request-ticket`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "api_key": token
            },
            body: JSON.stringify(devicesBody)
        });

        if (!response.ok) {
            const re = await response.json();
            console.log("Not successful: Status ", re.status);
            throw new Error(`Failed to get ticket: ${JSON.stringify(re)}`);
        }

        const res = await response.json();
        // console.log(`DEBUG : SUCCESS : received requestId = ${res.items.requestId}`);

        return [token, res.items.requestId];
    } catch (error) {
        console.error(`Error getting ticket: ${error.message}`);
        throw error;
    }
};

const getDetails = async (token, ticket) => {
    try {
        // console.log(`DEBUG : Starting getDetails call with requestId= ${ticket} for deviceId= ["${deviceId}"] with token ${token.slice(0, 25)}[...]`);
        const detailBody = {
            deviceIds: [deviceId],
            requestId: ticket
        };

        const lux = await sendRj(deviceIp, 1515, ecoSensorhex)

        // console.log("DEBUG : request Body = ", JSON.stringify(detailBody));
        const response = await fetch(`${server}:${port}/MagicInfo/restapi/v2.0/rms/devices/current-display-info`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "api_key": token
            },
            body: JSON.stringify(detailBody)
        });
        if (!response.ok) {
            throw new Error(`Failed to get details: ${response.status}`);
        }
        const res = await response.json();
        // console.log("Result is = ", res);

        if (res.items.successList.length === 0) {
            console.log("Request failed...");
            return res
        }
        if (res.items.successList.length > 0) {
            const final = {
                dateTime: new Date(),
                pvBrightness: res.items.successList[0].pvBrightness,
                ecoSensor: res.items.successList[0].ecoSensor,
                ecoSensorValue: lux,
                mntManual: res.items.successList[0].mntManual,
                brightnessLimit: res.items.successList[0].brightnessLimit
            };
            // console.log(final);
            // return res.items.successList[0];
            return final;
        }
    } catch (error) {
        console.error(`Error getting details: ${error.message}`);
        throw error;
    }
};

const callInterval = async () => {
    setInterval(async () => {
        try {
            // console.log(`DEBUG : Starting the API Call`);
            const token = await getToken();
            setTimeout(async()=>
           { 
                const [ticketToken, ticket] = await getTicket(token);
                
                setTimeout(async () => {
                    
                    const details = await getDetails(ticketToken, ticket);
                    console.log(details);

                }, 5000)
           }, 3000)
        

        } catch (error) {
            console.error(`API Call error: ${error.message}`);
        }
    }, timeout);
};

(async () => {
    try {
        await callInterval();
    } catch (error) {
        console.error(`Initialization error: ${error.message}`);
    }
})();
