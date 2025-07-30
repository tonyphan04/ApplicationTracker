# ApplicationTracker

## Overview

ApplicationTracker is a Node.js tool that helps you track your job or school applications by connecting to your Gmail account, extracting relevant emails, and saving the application data to a local JSON file. Optionally, you can extend it to upload the latest data to Google Drive for easy access from anywhere.

## Features

- Connects to your Gmail account using Google OAuth2
- Searches for emails related to applications, interviews, offers, or updates
- Extracts and saves application information (company, title, date, status) to `applications.json`
- Prevents duplicate entries by tracking processed emails
- Easily extendable to upload your data to Google Drive

## How it works

The backend connects to Gmail, searches for emails with subjects containing keywords like "application", "interview", "offer", or "update", and extracts relevant information. The data is saved in `applications.json` for easy tracking and further processing.

## applications.json Format

The `applications.json` file is an array of objects, each representing an application. Example:

```json
[
  {
    "id": "19855af2703b66a9",
    "company": "Company name",
    "title": "Software Engineer",
    "appliedDate": "2025-07-29",
    "status": "Applied"
  }
]
```

| Field       | Description                                |
| ----------- | ------------------------------------------ |
| id          | Unique Gmail message ID                    |
| company     | Company name (parsed from email subject)   |
| title       | Email subject or job title                 |
| appliedDate | Date the application was sent (YYYY-MM-DD) |
| status      | Application status (default: "Applied")    |

## Improvements

Here are some ideas for future improvements:

- Add a web dashboard to visualize and manage your applications
- Integrate with Google Drive to automatically upload and update the JSON file
- Implement notifications (email, SMS, or push) for status updates
- Enhance email parsing to extract more detailed information (position, location, recruiter, etc.)
- Add authentication and user management for multi-user support
- Export data to CSV or Excel formats
- Schedule automatic email checks and updates

## License

MIT
