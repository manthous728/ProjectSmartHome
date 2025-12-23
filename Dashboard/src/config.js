export const API_BASE_URL = "http://127.0.0.1:8000";
// export const MQTT_BROKER_URL = "ws://broker.hivemq.com:8000/mqtt";

export const MQTT_CONFIG = {
    host: "broker.hivemq.com",
    port: 8000,
    useSSL: false,
    autoConnect: true,
    topics: {
        dht22: "sensor/dht22",
        pzem004t: "sensor/pzem004t",
        mq2: "sensor/mq2",
        bh1750: "sensor/bh1750",
        relay_cmd: "command/relay/",
        relay_status_base: "status/relay/",
    },
    updateInterval: 5,
    thresholds: {
        dht22: {
            tempMax: 35,
            tempMin: 15,
            humMax: 80,
            humMin: 30,
        },
        mq2: {
            smokeMax: 500,
            smokeWarn: 350,
            lpgMax: 1000,
            lpgWarn: 500,
            coMax: 500,
            coWarn: 200,
        },
        pzem004t: {
            powerMax: 2000,
            voltageMin: 180,
            voltageMax: 240,
            currentMax: 10,
            energyMax: 100,
            pfMin: 0.85,
        },
        bh1750: {
            luxMax: 1000,
            luxMin: 0,
        },
    },
};
