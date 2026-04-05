const { GoogleGenerativeAI } = require("@google/generative-ai");
const Complaint = require("../models/Complaint");

// 💡 Simple Rule-based logic combined with AI fallback
// If no GEMINI_API_KEY is found, it will use a simple rule-based system or a funny placeholder.
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

const handleChat = async (req, res) => {
    try {
        const { message, history } = req.body;
        const msg = message.trim();

        // 1. Try to see if there's a complaint number in the message
        const complaintNoRegex = /MUN-\d{4}-\d{5}/i;
        const match = msg.match(complaintNoRegex);

        if (match) {
            const complaintNo = match[0].toUpperCase();
            const complaint = await Complaint.findOne({ complaintNo });

            if (complaint) {
                const statusMap = {
                    'submitted': 'we have received your complaint and it is waiting for review.',
                    'under_review': 'an official is currently reviewing your report.',
                    'assigned': 'your complaint has been assigned to a department.',
                    'in_progress': 'work is currently underway to resolve your issue.',
                    'resolved': 'your complaint has been marked as resolved! Thank you for your patience.',
                    'rejected': 'unfortunately, your complaint was rejected. Please check the details for any notes.'
                };

                return res.json({
                    success: true,
                    response: `I found complaint ${complaintNo}. Its current status is ${complaint.status.replace('_', ' ')}. Specifically, ${statusMap[complaint.status] || 'it is being processed.'}`,
                    action: 'navigate',
                    path: `/track/${complaintNo}`
                });
            } else {
                return res.json({
                    success: true,
                    response: `I couldn't find any complaint with number ${complaintNo}. Please double-check the number and try again.`
                });
            }
        }

        // 2. Handle common keywords if no AI
        if (!genAI) {
            let response = "I'm your Municipal Buddy. How can I help you today?";
            let action = null;
            let path = null;

            if (msg.toLowerCase().includes('report') || msg.toLowerCase().includes('file') || msg.toLowerCase().includes('submit')) {
                response = "You can report a new issue by clicking the 'Report Problem' button or simply going to the Report page. Would you like to go there now?";
                action = 'navigate';
                path = '/report';
            } else if (msg.toLowerCase().includes('track') || msg.toLowerCase().includes('status') || msg.toLowerCase().includes('check')) {
                response = "To track a complaint, please provide your Complaint Number (e.g., MUN-2024-00001) or click the 'Track Complaint' button to go to the tracking page.";
                action = 'navigate';
                path = '/track';
            } else if (msg.toLowerCase().includes('hello') || msg.toLowerCase().includes('hi') || msg.toLowerCase().includes('hey')) {
                response = "Hello! I'm your official Municipal assistant. I can help you report civic issues like potholes, garbage, or faulty streetlights and track their resolution status. How can I assist you today?";
            }

            return res.json({ success: true, response, action, path });
        }

        // 3. Use AI for smarter responses
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const chat = model.startChat({
            history: history || [],
            generationConfig: { maxOutputTokens: 200 }
        });

        const systemPrompt = `You are "Municipal Buddy", the official AI assistant of the Municipal Problem Reporting System. 
Your goal is to help citizens report civic issues (roads, garbage, streetlights, drainage, water) and track them.
Current context:
- System allows: Reporting problems, tracking by ID, viewing maps of reports.
- Roles: Citizen (user) and Admin (municipality staff).
- Help users navigate: /report to report, /track to track.
- If they ask for your capabilities, list them clearly.
- Keep responses professional, helpful, and concise (under 3 sentences unless necessary).
- ALWAYS be polite.`;

        const finalMsg = `${systemPrompt}\n\nUser: ${msg}`;
        const result = await chat.sendMessage(finalMsg);
        const response = result.response.text();

        // Detect if AI wants to navigate
        let action = null;
        let path = null;
        if (response.toLowerCase().includes('/report')) {
            action = 'navigate';
            path = '/report';
        } else if (response.toLowerCase().includes('/track')) {
            action = 'navigate';
            path = '/track';
        }

        return res.json({ success: true, response, action, path });

    } catch (error) {
        console.error("Chat Controller Error:", error);
        res.status(500).json({ success: false, error: "Failed to process chat" });
    }
};

module.exports = { handleChat };
