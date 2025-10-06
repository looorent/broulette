import fs from "fs";

const filePath = "../../doc/overpass/20251003_overpass_belgium.json";

try {
  const data = fs.readFileSync(filePath, "utf8");
  const json = JSON.parse(data);
  const array = json.elements;

  if (Array.isArray(array)) {
    console.log("Number of restaurants presents in Overpass:", array.length);
  } else {
    console.error('Error: The specified key does not contain an array.');
  }

} catch (err) {
  console.error('Error reading or parsing JSON file:', err.message);
}
