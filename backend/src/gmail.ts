import fs from 'fs';
import path from 'path';
import { getGmailClient } from './auth';
import { Application } from './type';

const jsonPath = path.join(__dirname, '..', 'applications.json');
let processedIds = new Set<string>();

export const loadApplications = (): Application[] => {
  if (!fs.existsSync(jsonPath)) return [];
  const fileContent = fs.readFileSync(jsonPath, 'utf-8').trim();
  if (!fileContent) return [];
  let data: Application[] = [];
  try {
    data = JSON.parse(fileContent);
  } catch (e) {
    console.error('Error parsing applications.json:', e);
    return [];
  }
  processedIds = new Set(data.map((a: Application) => a.id));
  return data;
};

export const saveApplications = (apps: Application[]) => {
  fs.writeFileSync(jsonPath, JSON.stringify(apps, null, 2));
};

export const fetchNewApplications = async (): Promise<Application[]> => {
  // 1. Get an authenticated Gmail client
  const gmail = getGmailClient();

  // 2. Load existing applications from the local JSON file
  const existing = loadApplications();

  // 3. Fetch a list of recent Gmail messages matching keywords
  const res = await gmail.users.messages.list({
    userId: 'me',
    q: 'subject:(application OR interview OR offer OR update)', // Search for relevant subjects
    maxResults: 100, // Limit to 1000 results
  });

  // 4. Extract the messages array (may be empty)
  const messages = res.data.messages || [];
  // 5. Prepare an array to hold new application entries
  const newApps: Application[] = [];

  // 6. Loop through each message
  for (const msg of messages) {
    // 7. Skip if message has no id or was already processed
    if (!msg.id || processedIds.has(msg.id)) continue;

    // 8. Fetch the full message details from Gmail
    const full = await gmail.users.messages.get({
      userId: 'me',
      id: msg.id,
      format: 'full',
    });

    // 9. (Optional) Log the full message data for debugging
    console.log('Data:', full.data);

    // 10. Extract headers from the message payload
    const headers = full.data.payload?.headers || [];
    // 11. Get the subject and date from headers
    const subject = headers.find(h => h.name === 'Subject')?.value || '';
    const date = headers.find(h => h.name === 'Date')?.value || '';

    // 12. Create an Application object from the message
    const app: Application = {
      id: msg.id, // Unique Gmail message ID
      company: subject.split(' ')[0], // Use first word of subject as company (customize as needed)
      title: subject, // Use full subject as title
      appliedDate: new Date(date).toISOString().split('T')[0], // Format date as YYYY-MM-DD
      status: 'Applied', // Default status
    };

    // 13. Add the new application to the array
    newApps.push(app);
  }

  // 14. Combine existing and new applications
  const updated = [...existing, ...newApps];
  // 15. Save the updated list to the JSON file
  saveApplications(updated);
  // 16. Log the new applications for review
  console.log(newApps);
  // 17. Return the new applications
  return newApps;
};
