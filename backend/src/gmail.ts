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
  // 5. Prepare a map to hold the latest application per company
  const latestApps: Record<string, Application> = {};

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
    // console.log('Data:', full.data);

    // 10. Extract headers from the message payload
    const headers = full.data.payload?.headers || [];
    // 11. Get the subject and date from headers
    const subject = headers.find(h => h.name === 'Subject')?.value || '';
    const date = headers.find(h => h.name === 'Date')?.value || '';

    // 12. Extract the plain text or HTML body content
    let body = '';
    const getBody = (payload: any): string => {
      if (!payload) return '';
      if (payload.parts) {
        for (const part of payload.parts) {
          const result = getBody(part);
          if (result) return result;
        }
      }
      if (payload.body && payload.body.data) {
        try {
          return Buffer.from(payload.body.data, 'base64').toString('utf-8');
        } catch {
          return '';
        }
      }
      return '';
    };
    body = getBody(full.data.payload);

    // 13. Infer status from the email content
    let status = 'Applied';
    const content = (subject + ' ' + body).toLowerCase();
    if (content.includes('interview')) status = 'Interview';
    else if (content.includes('unfortunately') || content.includes('unsuccessful') || content.includes('regret')) status = 'Rejected';
    else if (content.includes('assessment')) status = 'Assessment';
    else if (content.includes('update')) status = 'Update';


    // 14. Try to detect company name from subject or content
    function extractCompanyName(subject: string, body: string): string {
      // 1. Look for 'at <Company>', 'by <Company>', 'in <Company>', 'to <Company>' in both subject and body
      const patterns = [
        /at ([A-Z][a-zA-Z0-9&.\- ]+)/,
        /by ([A-Z][a-zA-Z0-9&.\- ]+)/,
        /in ([A-Z][a-zA-Z0-9&.\- ]+)/,
        /to ([A-Z][a-zA-Z0-9&.\- ]+)/
      ];
      for (const pattern of patterns) {
        let match = subject.match(pattern);
        if (match && match[1]) return match[1].trim();
        match = body.match(pattern);
        if (match && match[1]) return match[1].trim();
      }

      // 2. Look for capitalized words (likely company names) in both subject and body
      const capitalizedPattern = /\b([A-Z][a-zA-Z0-9&.\-]+)\b/g;
      let candidates = [];
      let m;
      // Check subject
      while ((m = capitalizedPattern.exec(subject)) !== null) {
        if (m[1].toLowerCase() !== 'application' && m[1].toLowerCase() !== 'interview' && m[1].toLowerCase() !== 'offer' && m[1].toLowerCase() !== 'update') {
          candidates.push(m[1]);
        }
      }
      // Check body
      capitalizedPattern.lastIndex = 0;
      while ((m = capitalizedPattern.exec(body)) !== null) {
        if (m[1].toLowerCase() !== 'application' && m[1].toLowerCase() !== 'interview' && m[1].toLowerCase() !== 'offer' && m[1].toLowerCase() !== 'update') {
          candidates.push(m[1]);
        }
      }
      if (candidates.length > 0) return candidates[0];

      // 3. Fallback: use first word of subject
      return subject.split(' ')[0];
    }

    const company = extractCompanyName(subject, body);

    // 15. Create an Application object from the message
    const app: Application = {
      id: msg.id, // Unique Gmail message ID
      company, // Improved company name extraction
      title: subject, // Use full subject as title
      appliedDate: new Date(date).toISOString().split('T')[0], // Format date as YYYY-MM-DD
      status,
    };

    // 15. Only keep the latest email per company (by appliedDate)
    const companyKey = app.company.toLowerCase();
    if (
      !latestApps[companyKey] ||
      new Date(app.appliedDate) > new Date(latestApps[companyKey].appliedDate)
    ) {
      latestApps[companyKey] = app;
    }
  }

  // 16. Combine existing and new applications, keeping only the latest per company
  // Remove any existing entries for companies we just updated
  const existingFiltered = existing.filter(
    app => !latestApps[app.company.toLowerCase()]
  );
  const updated = [...existingFiltered, ...Object.values(latestApps)];
  // 17. Save the updated list to the JSON file
  saveApplications(updated);
  // 18. Log the new applications for review
  console.log(Object.values(latestApps));
  // 19. Return the new applications
  return Object.values(latestApps);
};
