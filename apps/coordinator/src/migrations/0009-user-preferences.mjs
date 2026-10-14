import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
export function userPreferencesMigration(){return{
  id:'0009_user_preferences',definition:readFileSync(fileURLToPath(import.meta.url),'utf8').replace(/\r\n/g,'\n'),
  run:async connection=>{
    const [rows]=await connection.execute("SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND COLUMN_NAME='preferences_json'");
    if(!rows.length)await connection.query('ALTER TABLE users ADD COLUMN preferences_json JSON NULL');
  }
};}
