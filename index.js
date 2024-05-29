import 'dotenv/config';

const server = process.env.MIS_SERVER || "localhost";
const port = process.env.MIS_PORT || "7002";
const user = process.env.MIS_USER || "none";
const password = process.env.MIS_PASSWORD || "none";
const deviceId = process.env.DEVICE_ID || "none";
const timeout = process.env.TIMEOUT || 15000;

const authBody = {
    username: user,
    password
};

const devicesBody = {
    ids: [deviceId]
};

console.log(`DEBUG : Will use ${server}:${port} as the URL to fetch for device ${deviceId} every ${timeout}ms`);

const getToken = async () => {
    try {
        console.log("DEBUG : starting getToken ... ");
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
        console.log("DEBUG : SUCCESS: Token received");
        return res.token;
    } catch (error) {
        console.error(`Error fetching token: ${error.message}`);
        throw error;
    }
};

const getTicket = async (token) => {
    try {
        console.log(`DEBUG : Starting getTicket call ... with token ${token.slice(0, 25)}[...]`);
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
        console.log(`DEBUG : SUCCESS : received requestId = ${res.items.requestId}`);

        return [token, res.items.requestId];
    } catch (error) {
        console.error(`Error getting ticket: ${error.message}`);
        throw error;
    }
};

const getDetails = async (token, ticket) => {
    try {
        console.log(`DEBUG : Starting getDetails call with requestId= ${ticket} for deviceId= ["${deviceId}"] with token ${token.slice(0, 25)}[...]`);
        const detailBody = {
            deviceIds: [deviceId],
            requestId: ticket
        };
        console.log("DEBUG : request Body = ", JSON.stringify(detailBody));
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
                brightnessLimit: res.items.successList[0].brightnessLimit
            };
            // console.log(final);
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
            console.log(`DEBUG : Starting the API Call`);
            const token = await getToken();
            const [ticketToken, ticket] = await getTicket(token);
            const details = await getDetails(ticketToken, ticket);
            console.log(details);
            
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
