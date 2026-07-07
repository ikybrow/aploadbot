import axios from "axios";
import config from "../../config.js";
import mess from "../../strings.js";

export async function handle(sock, messageInfo) {
    const { remoteJid, message, sender, content, isQuoted, prefix, command, pushName } = messageInfo;

    try {
        const text = content && content.trim() !== '' ? content : isQuoted?.text ?? null;

        // Validasi format input
        if (!text) {
            await sock.sendMessage(
                remoteJid,
                {
                    text: `_⚠️ Format Penggunaan:_\n\n_💬 Contoh:_ *${prefix + command} halo*`
                },
                { quoted: message }
            );
            return;
        }

        // Reaction loading ⏰
        await sock.sendMessage(remoteJid, {
            react: { text: "⏰", key: message.key }
        });

        // Ambil profile picture langsung dari WhatsApp
        let ppUser;
        try {
            ppUser = await sock.profilePictureUrl(sender, "image");
        } catch {
            ppUser = "https://telegra.ph/file/8b98b6b2c274e6d4f0f2d.jpg"; // fallback default PP
        }

        // Buat URL API
        const api = `${config.API}/maker/fakestory?` +
            `username=${encodeURIComponent(pushName)}` +
            `&caption=${encodeURIComponent(text)}` +
            `&avatar=${encodeURIComponent(ppUser)}`;

        const response = await axios.get(api, { responseType: "arraybuffer" });

        // Kirim hasil edit
        await sock.sendMessage(
            remoteJid,
            {
                image: response.data,
                caption: mess.general.success
            },
            { quoted: message }
        );

        // Delay biar smooth sebelum ✅
        await new Promise(res => setTimeout(res, 1000));

        // Reaction selesai ✅
        await sock.sendMessage(remoteJid, {
            react: { text: "✅", key: message.key }
        });

    } catch (error) {
        console.error(error);

        await sock.sendMessage(
            remoteJid,
            {
                text: `Maaf, terjadi kesalahan saat memproses permintaan Anda.\n\nError: ${error.message}`
            },
            { quoted: message }
        );
    }
}

export default {
    handle,
    Commands: ["fakestory"],
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 2,
};
