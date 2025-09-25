import { promises as fs } from 'fs';
import path from 'path';

// read saved_chats folder and format/display chats
export const getSavedChatList = async () => {
    const savedChatsFolder = 'saved_chats';
    try {
        await fs.access(savedChatsFolder);
        const files = await fs.readdir(savedChatsFolder);
        const chats = [];
        for (const file of files) {
            if (path.extname(file) === '.json') {
                const filePath = path.join(savedChatsFolder, file);
                const fileContent = await fs.readFile(filePath, 'utf-8');
                const messages = JSON.parse(fileContent);
                const chatTitle = messages.length > 0 ? messages[0].text : 'New Chat';
                chats.push({ filename: file, chatTitle });
            }
        }
        return chats;
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        throw error;
    }
};