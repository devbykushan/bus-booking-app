import { getPool } from './db/database';
import fs from 'fs';

async function run() {
  const p = getPool();
  try {
    const res = await p.query("SELECT * FROM routes ORDER BY \"departureDate\" ASC, \"departureTime\" ASC LIMIT 40");
    
    let md = "# 🗓️ Database Routes Preview\n\n";
    md += "මෙන්න දත්ත සමුදායේ (Database) දැනට සේව් වෙලා තියෙන මුල්ම ගමන්වාර (Trips) කිහිපයේ Preview එකක්:\n\n";
    md += "| Date | Bus Number | Origin | Destination | Departure Time | Price |\n";
    md += "|---|---|---|---|---|---|\n";
    
    for (const r of res.rows) {
      md += `| ${r.departureDate} | **${r.busNumber}** | ${r.origin} | ${r.destination} | ${r.departureTime} | Rs. ${r.priceStarting} |\n`;
    }
    
    fs.writeFileSync('../database_preview.md', md);
    console.log("Preview generated!");
  } catch(e) {
    console.error(e);
  } finally {
    p.end();
  }
}
run();
