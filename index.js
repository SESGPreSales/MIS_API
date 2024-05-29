import 'dotenv/config'

const server = process.env.MIS_SERVER || "localhost"
const port = process.env.MIS_PORT || "7002"
const user = process.env.MIS_USER || "none"
const password = process.env.MIS_PASSWORD || "none"
const deviceId = process.env.DEVICE_ID || "none"


const authBody = {
    username : user,
    password
}

const devicesBody = {
    ids:[deviceId]
}

console.log(`Will use ${server} as the URL to fetch`)

const getToken = async () => {
    try {

        console.log("starting getToken ... ")
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
        console.log("SUCCESS: Token received")
        return res.token;

    } catch (error) {
        console.error(`Error fetching token: ${error.message}`);
        throw error;
    }
};

const getTicket = async (token) => {
    try {
        console.log(`Starting getTicket call ... with token ${token.slice(0, 25)}[...]`);
        const response = await fetch(`${server}:${port}/MagicInfo/restapi/v2.0/rms/devices/current-display-info/request-ticket`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "api_key": token
            },
            body: JSON.stringify(devicesBody)
        });

        if (response.status !== 200) {
            const re = await response.json()
            console.log("Not successful: Status ", re.status);
            throw new Error(`Failed to get ticket: ${JSON.stringify(re)}`);
        }

        const res = await response.json();
        console.log(`SUCCESS : received requestId = ${res.items.requestId}`);

        return [token, res.items.requestId];

    } catch (error) {
        console.error(`Error getting ticket: ${error.message}`);
        throw error;
    }
};

const getDetails = async (token, ticket) => {
    try {
        console.log(`Starting getDetails call with requestId= ${ticket} for deviceId= ["${deviceId}"] with token ${token.slice(0, 25)}[...]`);
        const detailBody = {
            deviceIds: [deviceId],
            requestId: ticket
        };
        console.log("request Body = ", JSON.stringify(detailBody)
        )
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
        console.log("Result is = ", res);
        if (res.items.successList.length === 0 ) {
            console.log("Request failed...")
            throw new Error(`Failed to get details: (no successList, only FailList)`)
        }
        if (res.items.successList.length > 0 ) {
            const final = {
                dateTime : new Date(),
                pvBrightness :res.items.successList[0].pvBrightness, 
                ecoSensor: res.items.successList[0].ecoSensor, 
                brightnessLimit: res.items.successList[0].brightnessLimit }
            console.log(final) 
            return final
         }
    } catch (error) {
        console.error(`Error getting details: ${error.message}`);
        throw error;
    }
};
 

const callInterval = async () => {
    setInterval(async () => {
        try {
            console.log(`Starting the API Call`);
            const to = await getToken();
            const [token, ticket] = await getTicket(to);
            setTimeout(async () => {
                
                const details = await getDetails(token, ticket);
                console.log(details);
                
            }, 500)
        } catch (error) {
            console.error(`API Call error: ${error.message}`);
        }
    }, 5000);
};

(async () => {
    try {
        callInterval();
    } catch (error) {
        console.error(`Initialization error: ${error.message}`);
    }
})();