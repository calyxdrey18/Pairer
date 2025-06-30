const express = require('express');
const fs = require('fs');
const router = express.Router();
const pino = require("pino");
const { 
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore
} = require("baileys");

// Configuration
const SESSION_DIR = process.env.SESSION_DIR || './session';

// Helper functions
function removeFile(filePath) {
    if(!fs.existsSync(filePath)) return false;
    fs.rmSync(filePath, { recursive: true, force: true });
}

// Main pairing endpoint
router.get('/', async (req, res) => {
    let num = req.query.number;
    
    if(!num || !/^\d{8,15}$/.test(num)) {
        return res.status(400).json({ error: "Invalid phone number format" });
    }

    async function XeonPair() {
        const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
        
        try {
            let XeonBotInc = makeWASocket({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({level: "fatal"}).child({level: "faltal"})),
                },
                printQRInTerminal: false,
                logger: pino({level: "fatal"}).child({level: "fatal"}),
                browser: ["Ubuntu", "Chrome", "20.0.04"],
            });

            if(!XeonBotInc.authState.creds.registered) {
                await delay(1500);
                num = num.replace(/[^0-9]/g, '');
                const code = await XeonBotInc.requestPairingCode(num);
                
                if(!res.headersSent) {
                    return res.json({ code });
                }
            }

            XeonBotInc.ev.on('creds.update', saveCreds);
            XeonBotInc.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect } = s;
                
                if (connection === "open") {
                    await delay(10000);
                    const sessionXeon = fs.readFileSync(`${SESSION_DIR}/creds.json`);
                    const audioxeon = fs.readFileSync('./kongga.mp3');
                    
                    XeonBotInc.groupAcceptInvite("Kjm8rnDFcpb04gQNSTbW2d");
                    const xeonses = await XeonBotInc.sendMessage(
                        XeonBotInc.user.id, 
                        { document: sessionXeon, mimetype: `application/json`, fileName: `creds.json` }
                    );
                    
                    await XeonBotInc.sendMessage(XeonBotInc.user.id, {
                        audio: audioxeon,
                        mimetype: 'audio/mp4',
                        ptt: true
                    }, { quoted: xeonses });

                    await XeonBotInc.sendMessage(XeonBotInc.user.id, { 
                        text: `*╭❍* *𝐒𝐔𝐂𝐂𝐄𝐒𝐒𝐅𝐔𝐋𝐋𝐘 𝐂𝐎𝐍𝐍𝐄𝐂𝐓𝐄𝐃* *❍*\n` +
                              `*┊* 𝐏𝐥𝐞𝐚𝐬𝐞 𝐬𝐮𝐩𝐩𝐨𝐫𝐭 𝐨𝐮𝐫 𝐜𝐡𝐚𝐧𝐧𝐞𝐥𝐬\n` +
                              `*┊*❶ || *ᴡʜᴀᴛsᴀᴘᴘ ᴄʜᴀɴɴᴇʟ* = https://whatsapp.com/channel/0029VagE9oHDp2Q34xE8S22c\n` +
                              `*┊*❷ || *ᴛᴇʟᴇɢʀᴀᴍ* = https://t.me/haxk_em\n` +
                              `*┊*➌ || *ʏᴏᴜᴛᴜʙᴇ* = https://www.youtube.com/@CalyxDrey\n` +
                              `*┊* 📛Don't share the creds.json file with anyone.\n` +
                              `*┊* *ᴠɪꜱɪᴛ ᴏᴜʀ ᴡᴇʙꜱɪᴛᴇ ғᴏʀ ᴍᴏʀᴇ* = 𝚙𝚎𝚗𝚍𝚒𝚗𝚐\n` +
                              `*┊* Upload the file on session folder.\n` +
                              `*╰═❍* *𝐏𝐨𝐰𝐞𝐫 𝐁𝐲 𝐂𝐚𝐥𝐲𝐱-𝐃𝐫𝐞𝐲*`
                    }, { quoted: xeonses });

                    await delay(100);
                    removeFile(SESSION_DIR);
                    process.exit(0);
                } else if (connection === "close" && lastDisconnect?.error?.output?.statusCode !== 401) {
                    await delay(10000);
                    XeonPair();
                }
            });
        } catch (err) {
            console.error("Error:", err);
            removeFile(SESSION_DIR);
            if(!res.headersSent) {
                return res.status(503).json({ error: "Service Unavailable" });
            }
        }
    }
    
    return XeonPair();
});

// Error handling for uncaught exceptions
process.on('uncaughtException', function (err) {
    const e = String(err);
    const ignorableErrors = [
        "conflict",
        "Socket connection timeout",
        "not-authorized",
        "rate-overlimit",
        "Connection Closed",
        "Timed Out",
        "Value not found"
    ];
    
    if (!ignorableErrors.some(error => e.includes(error))) {
        console.log('Caught exception:', err);
    }
});

module.exports = router;