const { GoogleGenerativeAI } = require("@google/generative-ai");
const Complaint = require("../models/Complaint");
const generateComplaintNo = require("../utils/generateComplaintNo");
const { uploadToCloudinary } = require("../utils/cloudinary");

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

const COMPLAINT_NO_REGEX = /MUN-\d{4}-\d{5}/i;
const YES_REGEX = /^(yes|y|yeah|yep|ok|okay|sure|submit|confirm|go ahead)$/i;
const NO_REGEX = /^(no|n|not now|cancel|stop|edit|change|skip|without photo)$/i;
const VALID_CATEGORIES = ['Road', 'Garbage', 'Streetlight', 'Drainage', 'Water', 'Other'];
const VALID_AWAITING = ['category', 'location', 'description', 'photo_choice', 'photo', 'confirm'];

function detectIntent(text) {
    const lower = (text || '').toLowerCase();

    const isTrack = /(\btrack\b|\bstatus\b|\bupdate\b|check status|complaint number|where is)/.test(lower);
    const isRaise = /(\braise\b|\breport\b|\bfile\b|\bsubmit\b|\bregister\b|new complaint|\bproblem\b)/.test(lower);
    const isInfo = /(\bhelp\b|\bhow\b|what can you do|\boptions\b|\bmenu\b|\bservices\b|\binformation\b|\binfo\b)/.test(lower);
    const isGreeting = /\b(hello|hi|hey|namaste)\b/.test(lower);

    if (isTrack) return 'track';
    if (isRaise) return 'raise';
    if (isInfo || isGreeting) return 'info';
    return 'unknown';
}

function withFollowUp(text) {
    if (/help|proceed|😊|👍/i.test(text)) return text;
    return `${text}\nI'm here to help 😊`;
}

function parseJsonField(value, fallback) {
    if (value === undefined || value === null) return fallback;
    if (typeof value === 'object') return value;
    if (typeof value !== 'string') return fallback;
    try {
        return JSON.parse(value);
    } catch (_err) {
        return fallback;
    }
}

function normalizeFlowState(flowState) {
    const state = flowState || {};
    const normalized = {
        intent: state.intent === 'raise' ? 'raise' : null,
        category: typeof state.category === 'string' ? state.category.trim() : '',
        location: typeof state.location === 'string' ? state.location.trim() : '',
        description: typeof state.description === 'string' ? state.description.trim() : '',
        photo: state.photo && typeof state.photo === 'object'
            ? { imageUrl: state.photo.imageUrl || '', publicId: state.photo.publicId || '' }
            : null,
        awaiting: VALID_AWAITING.includes(state.awaiting) ? state.awaiting : 'category'
    };

    if (!normalized.category) {
        normalized.awaiting = 'category';
    } else if (!normalized.location) {
        normalized.awaiting = 'location';
    } else if (!normalized.description) {
        normalized.awaiting = 'description';
    } else if (!VALID_AWAITING.includes(normalized.awaiting) || normalized.awaiting === 'description') {
        normalized.awaiting = normalized.photo ? 'confirm' : 'photo_choice';
    }

    return normalized;
}

function isRaiseRequestOnly(msg) {
    const lower = msg.toLowerCase().trim();
    return /^(i want to )?(raise|report|file|submit)( a| my)?( complaint| problem)?$/i.test(lower)
        || /^(new complaint|report issue|file complaint)$/i.test(lower);
}

function isMeaningfulInput(msg) {
    return /[a-z0-9]/i.test(msg) && msg.trim().length >= 2;
}

function mapCategory(text) {
    const lower = text.toLowerCase();
    if (/road|pothole|street damage/.test(lower)) return 'Road';
    if (/garbage|waste|trash/.test(lower)) return 'Garbage';
    if (/streetlight|light|lamp/.test(lower)) return 'Streetlight';
    if (/drain|drainage|sewer/.test(lower)) return 'Drainage';
    if (/water|leakage|pipe|supply/.test(lower)) return 'Water';
    return text.trim();
}

function toDbCategory(category) {
    const mapped = mapCategory(category || '').trim();
    return VALID_CATEGORIES.includes(mapped) ? mapped : 'Other';
}

function toDbDescription(category, description) {
    const raw = (description || '').trim();
    const mapped = mapCategory(category || '').trim();
    const prefix = VALID_CATEGORIES.includes(mapped) ? '' : `Issue type provided by citizen: ${mapped}. `;
    const finalText = `${prefix}${raw}`.trim();
    if (finalText.length >= 20) return finalText;
    return `${finalText} Reported via Municipal Buddy chatbot.`.trim();
}

async function createComplaintFromFlow(state) {
    const defaultLat = Number(process.env.CHATBOT_DEFAULT_LAT || 20.5937);
    const defaultLng = Number(process.env.CHATBOT_DEFAULT_LNG || 78.9629);

    const complaintNo = await generateComplaintNo();
    const complaint = await Complaint.create({
        complaintNo,
        category: toDbCategory(state.category),
        description: toDbDescription(state.category, state.description),
        status: 'submitted',
        latitude: Number.isFinite(defaultLat) ? defaultLat : 20.5937,
        longitude: Number.isFinite(defaultLng) ? defaultLng : 78.9629,
        address: state.location.trim(),
        images: state.photo ? [state.photo] : [],
        statusLogs: [{
            oldStatus: '',
            newStatus: 'submitted',
            changedBy: 'municipal-buddy',
            note: state.photo ? 'Complaint submitted via chatbot with photo' : 'Complaint submitted via chatbot',
            changedAt: new Date()
        }],
    });

    return complaint;
}

function getSummary(state) {
    const photoLine = state.photo ? "\n- Photo: Attached" : "";
    return `Here's your complaint summary:\n- Issue: ${state.category}\n- Location: ${state.location}\n- Description: ${state.description}${photoLine}\n\nShall I submit this complaint?`;
}

function wantsPhoto(text) {
    const lower = text.toLowerCase();
    return /(yes|y|sure|okay|ok|upload|add photo|photo|image)/.test(lower);
}

function skipsPhoto(text) {
    return NO_REGEX.test(text.trim()) || /(skip photo|no photo|without photo|continue without)/.test(text.toLowerCase());
}

async function handleRaiseFlow(msg, flowState, uploadedPhoto, photoUploadError = '') {
    const state = normalizeFlowState(flowState);
    state.intent = 'raise';

    if (uploadedPhoto && !state.photo) {
        state.photo = uploadedPhoto;
    }

    if (!state.category) {
        if (isRaiseRequestOnly(msg)) {
            return {
                response: "I can help you raise a complaint 👍\nWhat type of issue are you facing? (e.g., garbage, water leakage, streetlight)",
                action: 'navigate',
                path: '/report',
                flowState: state
            };
        }

        if (isMeaningfulInput(msg)) {
            state.category = mapCategory(msg);
            state.awaiting = 'location';
            return {
                response: `Got it 👍 You're reporting a **${state.category} issue**.\nPlease share the location.`,
                action: 'navigate',
                path: '/report',
                flowState: state
            };
        }

        return {
            response: "What type of issue are you facing? (e.g., road, garbage, water leakage, streetlight)",
            action: 'navigate',
            path: '/report',
            flowState: state
        };
    }

    if (!state.location) {
        if (isMeaningfulInput(msg)) {
            state.location = msg.trim();
            state.awaiting = 'description';
            return {
                response: "Thanks! Could you briefly describe the issue?",
                action: null,
                path: null,
                flowState: state
            };
        }

        return {
            response: "Please share the location (area or street name) so I can continue.",
            action: null,
            path: null,
            flowState: state
        };
    }

    if (!state.description) {
        if (isMeaningfulInput(msg)) {
            if (msg.trim().length < 20) {
                return {
                    response: "Thanks! Please add a little more detail (at least 20 characters) so I can submit it.",
                    action: null,
                    path: null,
                    flowState: state
                };
            }

            state.description = msg.trim();
            state.awaiting = 'photo_choice';
            return {
                response: "Got it 👍\nWould you like to upload a photo of the issue? 📸\nThis helps us resolve your complaint faster.",
                action: null,
                path: null,
                flowState: state
            };
        }

        return {
            response: "Please add a brief description of the issue.",
            action: null,
            path: null,
            flowState: state
        };
    }

    if (state.awaiting === 'photo_choice') {
        if (photoUploadError) {
            return {
                response: "I couldn't upload that photo right now. Please try again, or type 'skip' to continue without photo.",
                action: null,
                path: null,
                flowState: state
            };
        }

        if (uploadedPhoto) {
            state.awaiting = 'confirm';
            return {
                response: `Photo received 👍\n${getSummary(state)}`,
                action: null,
                path: null,
                flowState: state
            };
        }

        if (wantsPhoto(msg)) {
            state.awaiting = 'photo';
            return {
                response: "Please upload an image of the issue.",
                action: null,
                path: null,
                flowState: state
            };
        }

        if (skipsPhoto(msg)) {
            state.awaiting = 'confirm';
            return {
                response: `No problem 👍\n${getSummary(state)}`,
                action: null,
                path: null,
                flowState: state
            };
        }

        return {
            response: "Would you like to upload a photo of the issue? 📸",
            action: null,
            path: null,
            flowState: state
        };
    }

    if (state.awaiting === 'photo') {
        if (photoUploadError) {
            return {
                response: "I couldn't upload that photo right now. Please try again, or type 'skip' to continue without photo.",
                action: null,
                path: null,
                flowState: state
            };
        }

        if (uploadedPhoto) {
            state.awaiting = 'confirm';
            return {
                response: `Photo received 👍\n${getSummary(state)}`,
                action: null,
                path: null,
                flowState: state
            };
        }

        if (skipsPhoto(msg)) {
            state.awaiting = 'confirm';
            return {
                response: `No problem 👍\n${getSummary(state)}`,
                action: null,
                path: null,
                flowState: state
            };
        }

        return {
            response: "Please upload an image of the issue. You can also type 'skip' to continue without a photo.",
            action: null,
            path: null,
            flowState: state
        };
    }

    if (YES_REGEX.test(msg.trim())) {
        let complaint;
        try {
            complaint = await createComplaintFromFlow(state);
        } catch (submitErr) {
            console.error('Chat complaint submission failed:', submitErr.message);
            return {
                response: "I couldn't submit your complaint right now because the database is unavailable. Please try again in a moment.",
                action: null,
                path: null,
                flowState: { ...state, awaiting: 'confirm' }
            };
        }

        return {
            response: withFollowUp(`Great! Your complaint has been submitted successfully. Your complaint number is ${complaint.complaintNo}.`),
            action: 'navigate',
            path: `/track/${complaint.complaintNo}`,
            flowState: { intent: null, category: '', location: '', description: '', photo: null, awaiting: 'category' }
        };
    }

    if (NO_REGEX.test(msg.trim())) {
        return {
            response: "No problem. Tell me what you'd like to change: issue type, location, or description.",
            action: null,
            path: null,
            flowState: state
        };
    }

    return {
        response: "Shall I submit this complaint? Please reply with Yes or No.",
        action: null,
        path: null,
        flowState: state
    };
}

function getRuleBasedResponse(msg) {
    const intent = detectIntent(msg);

    if (intent === 'track') {
        return {
            response: withFollowUp("Sure! Please share your Complaint Number (e.g., MUN-2024-00001), and I'll check the status for you."),
            action: 'navigate',
            path: '/track'
        };
    }

    if (intent === 'raise') {
        return {
            response: withFollowUp("I can help you raise a complaint 👍\nWhat type of issue are you facing? (e.g., garbage, water leakage, streetlight)"),
            action: 'navigate',
            path: '/report'
        };
    }

    if (intent === 'info') {
        return {
            response: withFollowUp(
                "I can help you with:\n1. Raise a complaint\n2. Track a complaint\n3. Get information\nJust tell me what you'd like to do 😊"
            ),
            action: null,
            path: null
        };
    }

    return {
        response: withFollowUp(
            "Hmm, I didn't catch that. I can help you raise a complaint, track a complaint, or answer service questions."
        ),
        action: null,
        path: null
    };
}

const handleChat = async (req, res) => {
    try {
        const body = req.body || {};
        const flowState = parseJsonField(body.flowState, body.flowState || {});
        const history = parseJsonField(body.history, body.history || []);
        const msg = (body.message || '').trim();
        const currentFlowState = normalizeFlowState(flowState);
        const intent = detectIntent(msg);
        let uploadedPhoto = null;
        let photoUploadError = '';

        if (req.file) {
            try {
                const result = await uploadToCloudinary(req.file.buffer, 'municipal-complaints/chatbot');
                uploadedPhoto = { imageUrl: result.imageUrl, publicId: result.publicId };
            } catch (uploadErr) {
                console.error('Chat photo upload failed:', uploadErr.message);
                photoUploadError = uploadErr.message || 'Photo upload failed';
            }
        }

        if (!msg && !uploadedPhoto && !photoUploadError) {
            return res.json({
                success: true,
                response: withFollowUp("Please type a message, and I'll help you right away."),
                action: null,
                path: null,
                flowState: currentFlowState
            });
        }

        const continuingRaiseFlow = currentFlowState.intent === 'raise' && intent !== 'track' && intent !== 'info';
        const uploadedInRaiseFlow = !!uploadedPhoto && currentFlowState.intent === 'raise';
        const uploadErrorInRaiseFlow = !!photoUploadError && currentFlowState.intent === 'raise';
        if (intent === 'raise' || continuingRaiseFlow || uploadedInRaiseFlow || uploadErrorInRaiseFlow) {
            const raiseResponse = await handleRaiseFlow(msg, currentFlowState, uploadedPhoto, photoUploadError);
            return res.json({ success: true, ...raiseResponse });
        }

        if (photoUploadError) {
            return res.json({
                success: true,
                response: "I couldn't upload that photo right now. Please try again after starting a complaint flow.",
                action: null,
                path: null,
                flowState: currentFlowState
            });
        }

        if (uploadedPhoto) {
            const photoState = normalizeFlowState({
                intent: 'raise',
                category: '',
                location: '',
                description: '',
                photo: uploadedPhoto,
                awaiting: 'category'
            });
            return res.json({
                success: true,
                response: "Photo received 👍\nPlease share the issue type (e.g., road, garbage, streetlight).",
                action: null,
                path: null,
                flowState: photoState
            });
        }

        // 1. Complaint lookup when a valid complaint number is present
        const match = msg.match(COMPLAINT_NO_REGEX);

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
                    response: withFollowUp(`I found complaint ${complaintNo}. Current status: ${complaint.status.replace('_', ' ')}. ${statusMap[complaint.status] || 'It is being processed.'}`),
                    action: 'navigate',
                    path: `/track/${complaintNo}`,
                    flowState: { intent: null, category: '', location: '', description: '', photo: null, awaiting: 'category' }
                });
            } else {
                return res.json({
                    success: true,
                    response: withFollowUp(`I couldn't find complaint number ${complaintNo}. Please double-check it and try again (example: MUN-2024-00001).`),
                    action: 'navigate',
                    path: '/track',
                    flowState: { intent: null, category: '', location: '', description: '', photo: null, awaiting: 'category' }
                });
            }
        }

        // 2. Track intent with invalid complaint format
        if (intent === 'track' && !/MUN-/i.test(msg)) {
            return res.json({
                success: true,
                response: withFollowUp("Sure! Please share your Complaint Number (e.g., MUN-2024-00001), and I'll check the status for you."),
                action: 'navigate',
                path: '/track',
                flowState: { intent: null, category: '', location: '', description: '', photo: null, awaiting: 'category' }
            });
        }

        // 3. Rule-based fallback when AI key is not configured
        if (!genAI) {
            const fallback = getRuleBasedResponse(msg);
            return res.json({
                success: true,
                ...fallback,
                flowState: { intent: null, category: '', location: '', description: '', photo: null, awaiting: 'category' }
            });
        }

        // 4. AI response with strict persona and response constraints
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const chat = model.startChat({
            history: history || [],
            generationConfig: { maxOutputTokens: 140 }
        });

        const systemPrompt = `You are Municipal Buddy, a smart, friendly, and efficient assistant for municipal services.

Goals:
1) Help citizens raise, track, and manage complaints بسهولة and clearly.
2) Give step-by-step guidance when needed.
3) Keep responses short, helpful, and conversational.

Tone:
- Friendly, polite, supportive.
- Clear and simple language.
- Slightly conversational.

Behavior rules:
- Understand user intent first: track complaint, raise complaint, or general query.
- If required information is missing, ask clearly for it.
- Give actionable steps, not vague statements.
- Use examples when useful.
- Keep replies concise: max 2-3 short lines.

Core handling:
- TRACK intent: ask for complaint number if missing. Example format: MUN-2024-00001.
- RAISE intent: collect details step-by-step: issue type, location, description.
- CONFUSED intent: provide options:
  1. Raise a complaint
  2. Track a complaint
  3. Get information
- INVALID input: politely request valid complaint number format.

Output style:
- Avoid long paragraphs.
- Use emojis sparingly (e.g., 😊 👍).
- End every response with a brief helpful follow-up, like "I'm here to help 😊" or "Let me know how you'd like to proceed!".

System navigation hints:
- Use /report for complaint submission guidance.
- Use /track for complaint tracking guidance.`;

        const finalMsg = `${systemPrompt}\n\nUser: ${msg}`;
        const result = await chat.sendMessage(finalMsg);
        const response = withFollowUp(result.response.text().trim());

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

        return res.json({
            success: true,
            response,
            action,
            path,
            flowState: { intent: null, category: '', location: '', description: '', photo: null, awaiting: 'category' }
        });

    } catch (error) {
        console.error("Chat Controller Error:", error);
        res.status(500).json({ success: false, error: "Failed to process chat" });
    }
};

module.exports = { handleChat };
