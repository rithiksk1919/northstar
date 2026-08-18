import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '5mb' }));
app.use(express.static(__dirname));

// Initialize official Google Gen AI SDK client
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn('⚠️ Warning: GEMINI_API_KEY environment variable is missing.');
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

// API Endpoint: Expose public Supabase configuration
app.get('/api/config', (req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || ''
  });
});

// In-Memory Database for Job & Work Opportunities
const inMemoryJobs = [
  {
    id: 'job-1',
    title: 'Warehouse Freight & Stocking Associate',
    company: 'Pacific Freight & Logistics',
    location: 'Seattle, WA (SODO District)',
    type: 'Entry Level / Day Shift',
    pay: '$21.50 / hr',
    requirements: ['Heavy Lifting (50+ lbs)', 'Forklift Certification (Preferred)', 'Punctuality & Reliability'],
    description: 'Load and unload incoming freight trucks, sort inventory pallets, and organize staging areas.',
    contact: 'intake@pacificfreight.org | (555) 345-9821',
    postedAt: new Date().toISOString()
  },
  {
    id: 'job-2',
    title: 'Kitchen Food Prep & Sanitation Assistant',
    company: 'Metro Dining & Catering',
    location: 'Seattle, WA (Downtown)',
    type: 'Full-Time / Flexible Hours',
    pay: '$19.00 / hr',
    requirements: ['Food Handler Card', 'Kitchen Sanitation Knowledge', 'Team Collaboration'],
    description: 'Assist line chefs with ingredient prep, maintain sanitized prep stations, and manage inventory stockrooms.',
    contact: 'careers@metrodining.com | (555) 872-1100',
    postedAt: new Date().toISOString()
  },
  {
    id: 'job-3',
    title: 'Sanitation & Custodial Maintenance Specialist',
    company: 'CleanCity Maintenance Services',
    location: 'Seattle, WA (Capitol Hill)',
    type: 'Part-Time / Evening Shift',
    pay: '$20.00 / hr',
    requirements: ['Custodial Experience', 'Reliability', 'Self-Motivated'],
    description: 'Perform floor maintenance, facility sanitation, and waste collection for commercial buildings.',
    contact: 'dispatch@cleancity.org | (555) 654-3210',
    postedAt: new Date().toISOString()
  }
];

// API Endpoint: Get all active job opportunities
app.get('/api/jobs', (req, res) => {
  res.json({ success: true, jobs: inMemoryJobs });
});

// API Endpoint: Post a new job opportunity (Helper Funnel)
app.post('/api/jobs', (req, res) => {
  try {
    const { title, company, location, type, pay, requirements, description, contact } = req.body;
    if (!title || !contact) {
      return res.status(400).json({ error: 'Title and contact details are required.' });
    }

    const newJob = {
      id: `job-${Date.now()}`,
      title,
      company: company || 'Community Partner Employer',
      location: location || 'Seattle, WA',
      type: type || 'Flexible Shift',
      pay: pay || '$18.00 - $22.00 / hr',
      requirements: Array.isArray(requirements) ? requirements : (requirements ? [requirements] : ['Reliable', 'Fast Learner']),
      description: description || 'Community entry-level work opportunity.',
      contact,
      postedAt: new Date().toISOString()
    };

    inMemoryJobs.unshift(newJob);
    console.log('✅ New Job Posted:', newJob.title);

    res.json({ success: true, job: newJob, total: inMemoryJobs.length });
  } catch (err) {
    console.error('Error posting job:', err);
    res.status(500).json({ error: 'Failed to post job opportunity.' });
  }
});

// API Endpoint: Generate AI Resume (Seeker Funnel)
app.post('/api/generate-resume', async (req, res) => {
  try {
    const {
      name,
      phone,
      contactInfo,
      location,
      experienceTypes,
      informalNotes,
      skillsCertifications,
      targetRoles
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required to generate a resume.' });
    }

    const systemInstruction = `
You are an expert, compassionate professional resume writer specializing in helping individuals who are experiencing homelessness, housing instability, or employment gaps.

YOUR GOAL:
Transform informal experience, volunteer tasks, day labor, caregiving, side jobs, and gap years into strong, professional, dignity-affirming action verbs and transferable skills.
Format the output for Applicant Tracking Systems (ATS) and modern hiring managers.

GUIDELINES:
1. Contact Info: Preserve contact information provided, including shelter contacts or message-only numbers.
2. Professional Summary: Write 2–3 concise, punchy lines emphasizing reliability, work ethic, punctuality, and key strengths. Do NOT explicitly mention homelessness or negative hardship unless relevant to strength and resilience; focus on work capacity.
3. Skills: Categorize practical skills, certifications (like Food Handler Card, Forklift, OSHA), and core soft skills (punctuality, heavy lifting, teamwork).
4. Work Experience: Translate day labor, kitchen work, caregiving, warehouse work, volunteering, or customer service into professional role titles (e.g., "Logistics & General Operations Worker", "Food Prep & Service Assistant", "Community Operations Volunteer"). Create 2-4 impact-oriented bullet points per role starting with strong action verbs (e.g., "Managed", "Operated", "Coordinated", "Maintained", "Executed").
5. Certifications & Education: List any certifications, licenses, training, or high school / GED / coursework.

Output MUST be strictly structured JSON matching the requested schema.
`;

    const userPrompt = `
User Profile Details:
- Full Name: ${name || 'N/A'}
- Phone Number: ${phone || 'N/A'}
- Shelter/Email Contact: ${contactInfo || 'N/A'}
- City & State / Zip: ${location || 'N/A'}
- Selected Work/Experience Types: ${Array.isArray(experienceTypes) ? experienceTypes.join(', ') : experienceTypes || 'General Labor & Community Work'}
- Informal Experience & Details: ${informalNotes || 'Flexible worker experienced in physical tasks, customer support, and daily assignments.'}
- Skills & Certifications Selected: ${Array.isArray(skillsCertifications) ? skillsCertifications.join(', ') : skillsCertifications || 'Reliable, Punctual, Fast Learner'}
- Target Job Types: ${Array.isArray(targetRoles) ? targetRoles.join(', ') : targetRoles || 'General Labor, Food Service, Retail, Operations'}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            contact_info: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                phone: { type: Type.STRING },
                contact: { type: Type.STRING },
                location: { type: Type.STRING }
              },
              required: ['name', 'phone', 'contact', 'location']
            },
            summary: { type: Type.STRING },
            skills: {
              type: Type.OBJECT,
              properties: {
                certifications: { type: Type.ARRAY, items: { type: Type.STRING } },
                practical_skills: { type: Type.ARRAY, items: { type: Type.STRING } },
                core_strengths: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ['certifications', 'practical_skills', 'core_strengths']
            },
            experience: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  role: { type: Type.STRING },
                  organization: { type: Type.STRING },
                  duration: { type: Type.STRING },
                  bullets: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ['role', 'organization', 'duration', 'bullets']
              }
            },
            certifications_education: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ['contact_info', 'summary', 'skills', 'experience', 'certifications_education']
        }
      }
    });

    const jsonText = response.text;
    const structuredResume = JSON.parse(jsonText);

    return res.json({
      success: true,
      data: structuredResume
    });
  } catch (err) {
    console.error('Error generating resume with Gemini API:', err);
    return res.status(500).json({
      error: 'Failed to generate resume',
      details: err.message
    });
  }
});

// API Endpoint: AI Connector (Matches Seeker Resume with Job Opportunities)
app.post('/api/match-jobs', async (req, res) => {
  try {
    const { seekerResume, customJobs } = req.body;

    const availableJobs = (Array.isArray(customJobs) && customJobs.length > 0) ? customJobs : inMemoryJobs;

    if (!seekerResume) {
      return res.status(400).json({ error: 'Seeker resume profile is required for matching.' });
    }

    const systemInstruction = `
You are an intelligent AI Job Matcher for NorthStar.
Your task is to compare a seeker's resume skills, certifications, and background against available job opportunities.

For EACH job opportunity provided:
1. Calculate a match percentage score (between 0% and 100%).
2. Provide a 1-sentence match highlight explanation of why this job is a great fit.
3. List 1-2 key matching skills between the job and candidate.

Return a structured JSON list of job matches ranked from highest match score to lowest.
`;

    const userPrompt = `
Seeker Profile:
${JSON.stringify(seekerResume, null, 2)}

Available Job Opportunities:
${JSON.stringify(availableJobs, null, 2)}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matches: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  jobId: { type: Type.STRING },
                  jobTitle: { type: Type.STRING },
                  company: { type: Type.STRING },
                  pay: { type: Type.STRING },
                  contact: { type: Type.STRING },
                  matchScore: { type: Type.NUMBER },
                  matchHighlight: { type: Type.STRING },
                  matchingSkills: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ['jobId', 'jobTitle', 'company', 'pay', 'contact', 'matchScore', 'matchHighlight', 'matchingSkills']
              }
            }
          },
          required: ['matches']
        }
      }
    });

    const jsonText = response.text;
    const structuredMatches = JSON.parse(jsonText);

    res.json({
      success: true,
      data: structuredMatches.matches
    });
  } catch (err) {
    console.error('Error matching jobs with Gemini API:', err);
    res.status(500).json({
      error: 'Failed to compute AI job matches',
      details: err.message
    });
  }
});

// Fallback to index.html for SPA routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 NorthStar Server running at http://localhost:${PORT}`);
});
