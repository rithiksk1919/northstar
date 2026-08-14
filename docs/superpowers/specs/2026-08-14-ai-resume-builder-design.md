# AI Resume Builder Feature Design Document

**Date**: 2026-08-14  
**Project**: NorthStar (Homelessness & Employment Support Portal)  
**Feature**: Low-Barrier AI Resume Builder powered by Google Gemini API

---

## 1. Overview & Purpose
The AI Resume Builder is designed to empower individuals experiencing homelessness, housing instability, or employment gaps to create a highly professional, ATS-formatted resume in minutes.

Traditional resume builders require long typing sessions, strict chronological timelines, and high digital literacy. NorthStar's AI Resume Builder removes these barriers by:
- Using a low-barrier, tap-friendly step-by-step wizard.
- Translating informal experience, volunteer work, day labor, caregiving, and employment gaps into strong, dignity-affirming action verbs and transferable skills.
- Utilizing `gemini-2.5-flash` via `@google/genai` to generate structured JSON.
- Providing live editing, one-click ATS plain-text copying, and clean single-page PDF exporting.

---

## 2. System Architecture & Components

### Architecture Diagram
```
+-------------------------------------------------------------------------+
|                              Frontend                                   |
|  [resume-builder.html] (Mobile App Ratio Frame & Responsive CSS)        |
|  - Low-barrier wizard with pre-selected chips                           |
|  - Interactive live preview & editable bullet points                    |
|  - ATS Text Copy & Single-Page PDF Print Handler                        |
+-------------------------------------------------------------------------+
                                  |
                           POST /api/generate-resume
                                  |
                                  v
+-------------------------------------------------------------------------+
|                              Backend                                    |
|  [server.js] (Express Server Node.js)                                    |
|  - Reads GEMINI_API_KEY from process.env                                |
|  - Uses @google/genai SDK with gemini-2.5-flash                         |
|  - Formats system instructions & enforces JSON Response Schema         |
+-------------------------------------------------------------------------+
```

---

## 3. Data Schema & API Contract

### Request: `POST /api/generate-resume`
```json
{
  "name": "Alex Johnson",
  "phone": "(555) 234-5678",
  "contactInfo": "Shelter Contact: St. Jude Hope Center / alex.j@email.com",
  "location": "Seattle, WA 98101",
  "experienceTypes": ["Day Labor", "Food Prep & Kitchen Work", "Community Volunteering"],
  "informalNotes": "Worked kitchen prep, unloaded delivery trucks, helped organize shelter food pantry.",
  "skillsCertifications": ["Food Handler Card", "Forklift Certified", "Heavy Lifting 50+ lbs", "Reliable & Punctual"],
  "targetRoles": ["Kitchen Staff", "Warehouse Associate", "General Laborer"]
}
```

### Response (Structured JSON output from Gemini):
```json
{
  "contact_info": {
    "name": "Alex Johnson",
    "phone": "(555) 234-5678",
    "contact": "Shelter Contact: St. Jude Hope Center / alex.j@email.com",
    "location": "Seattle, WA 98101"
  },
  "summary": "Dependable and physically active team member with hands-on experience in kitchen prep, logistics, and material handling. Proven track record of punctuality, safety compliance, and strong work ethic in fast-paced environments.",
  "skills": {
    "certifications": ["Food Handler Card", "Forklift Certified"],
    "practical_skills": ["Heavy Lifting (50+ lbs)", "Inventory Management", "Food Preparation & Sanitation", "Pallet Jack Operation"],
    "core_strengths": ["Reliability & Punctuality", "Teamwork & Collaboration", "Fast Learner"]
  },
  "experience": [
    {
      "role": "Logistics & General Operations Worker",
      "organization": "Independent Work & Day Labor",
      "duration": "Recent",
      "bullets": [
        "Unloaded commercial freight trucks and safely stacked heavy inventory up to 50 lbs.",
        "Operated forklift and manual material handling equipment following strict workplace safety guidelines.",
        "Collaborated with site supervisors to complete daily tasks efficiently."
      ]
    },
    {
      "role": "Food Service & Kitchen Assistant",
      "organization": "Community Food Services & Operations",
      "duration": "Recent",
      "bullets": [
        "Prepared food ingredients, maintained sanitized workstations, and managed food safety compliance.",
        "Organized stockrooms and food pantries to streamline daily meal distributions for 100+ community members."
      ]
    }
  ],
  "certifications_education": [
    "Washington State Food Handler Card",
    "OSHA Forklift Safety Certification"
  ]
}
```

---

## 4. UI/UX Design & Mobile Shell Integration

1. **Mobile Ratio Shell (`app-frame`)**:
   - Matches NorthStar's existing mobile mockup wrapper (`max-w-[420px]`, rounded corners, top status clock, header back button, bottom nav bar).
   - Fully responsive for mobile viewports and desktop viewports.

2. **Wizard Steps**:
   - **Step 1**: Basic Contact Info (Name, Phone, Email/Shelter Contact, City/Zip).
   - **Step 2**: Work & Informal Experience (Tap-to-select chips + brief details text area).
   - **Step 3**: Certifications & Skills (Tap badges for quick selection).
   - **Step 4**: Target Job Types (Tap buttons for quick selection).

3. **Output & Export Actions**:
   - **Interactive Live Preview**: Editable fields and bullet points.
   - **Copy Clean Text**: Strips HTML and outputs clean plain-text formatted for ATS web portals.
   - **Export / Print to PDF**: Custom `@media print` CSS ensuring single-page clean layout without header/footer UI noise.

---

## 5. Environment & Dependencies
- `GEMINI_API_KEY` stored in `.env`.
- `@google/genai` official Node.js SDK.
- `express` for API route handling and static file serving.
- `dotenv` for environment variable configuration.
