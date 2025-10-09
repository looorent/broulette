import fs from "fs";
import path from "path";

const LATEST_FILE_NAME = "latest.json";

function formatTimestamp() {
    const now = new Date();
    const YYYY = now.getFullYear();
    const MM = String(now.getMonth() + 1).padStart(2, "0");
    const DD = String(now.getDate()).padStart(2, "0");
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    return `${YYYY}${MM}${DD}_${mm}${hh}${ss}`;
}

export function readFromStorage(folderPath) {
    console.log(`Reading restaurants from storage at '${folderPath}'...`);
    const folder = path.resolve(folderPath);

    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
    }

    const filePath = path.resolve(folderPath, LATEST_FILE_NAME);

    if (!fs.existsSync(filePath)) {
        console.log(`Reading restaurants from storage at '${folderPath}'. File does not exist. Start from scratch.`);
        return {
            version: 0,
            restaurants: []
        };
    } else {
        const parsed = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        console.log(`Reading restaurants from storage at '${folderPath}'. Done. ${parsed?.restaurants?.length} restaurants found in version ${parsed?.version}.`);
        return parsed;
    }
}

export function writeToStorage(data, folderPath) {
    const formattedData = JSON.stringify(data, null, 2);
    const timestamp = formatTimestamp();
    
    const outputFile = path.join(folderPath, `${timestamp}_output.json`);
    console.log(`Writing restaurants to storage at '${outputFile}'...`);
    fs.writeFileSync(outputFile, formattedData, "utf-8");
    console.log(`Writing restaurants to storage at '${outputFile}': done.`);
    
    const latestFile = path.join(folderPath, "latest.json");
    console.log(`Writing restaurants to storage at '${latestFile}'...`);
    fs.writeFileSync(latestFile, formattedData, "utf-8");
    console.log(`Writing restaurants to storage at '${latestFile}': done.`);
    return data;
}