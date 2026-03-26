const { GoogleGenerativeAI } = require('@google/generative-ai');
const Professional = require('../models/Professional');

// @desc  AI assistant chat
// @route POST /api/ai/chat
const chat = async (req, res, next) => {
  try {
    const { message } = req.body;

    // Extract intent and service from message
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const systemContext = `You are ServiceHub AI, a helpful assistant for a service marketplace (customers only).
Return ONLY valid JSON (no markdown, no backticks) with one of the following shapes.

1) Find professionals:
{
  "intent": "find_professional",
  "category": "plumbing",
  "locationCity": "Sydney",
  "message": "friendly response to user",
  "searchUrl": "/professionals?category=plumbing&city=Sydney",
  "actions": [
    { "label": "Post a job", "url": "/post-job" }
  ]
}

2) Help with posting / booking / reviews / quotes:
{
  "intent": "help_customer_flow",
  "message": "step-by-step guidance",
  "actions": [
    { "label": "Post a job", "url": "/post-job" },
    { "label": "My dashboard", "url": "/dashboard/customer" }
  ]
}

3) General question:
{
  "intent": "general",
  "message": "your answer here",
  "actions": []
}

Rules:
- category should be a lowercase service keyword if the user asks for a specific trade (plumber/electrician/etc).
- locationCity should be a city/suburb name if the user provides one. If absent, omit it.
- searchUrl should be a relative URL for the Next.js routes.
- actions urls must be relative URLs.
- If the user asks "near me" or doesn't specify locationCity, still respond, but omit locationCity and keep actions generic.`;

    const result = await model.generateContent([systemContext, message]);
    const text = result.response.text();

    let parsed;
    try {
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { intent: 'general', message: text };
    } catch {
      parsed = { intent: 'general', message: text };
    }

    if (parsed.intent === 'find_professional') {
      const category = parsed.category ? String(parsed.category).toLowerCase() : '';

      // Prefer location from the message; otherwise use the logged-in user's city
      const locationCity =
        parsed.locationCity ||
        parsed.location ||
        req.user?.location?.city ||
        '';

      // Query approved professionals for the requested category
      const query = {
        isApproved: true,
        isRejected: false,
        isSuspended: false,
      };
      if (category) query.categories = { $in: [category] };

      const raw = await Professional.find(query)
        .limit(12)
        .populate('userId', 'name avatar location phone')
        .lean();

      const professionals = locationCity
        ? raw.filter((p) =>
            p.userId?.location?.city
              ?.toLowerCase()
              .includes(String(locationCity).toLowerCase())
          ).slice(0, 3)
        : raw.slice(0, 3);

      const cityPart = locationCity ? `&city=${encodeURIComponent(locationCity)}` : '';
      const searchUrl = category
        ? `/professionals?category=${encodeURIComponent(category)}${cityPart}`
        : parsed.searchUrl || '/professionals';

      return res.json({
        success: true,
        intent: 'find_professional',
        message: parsed.message,
        professionals,
        category,
        locationCity: locationCity || null,
        searchUrl,
        actions: Array.isArray(parsed.actions) ? parsed.actions : [{ label: 'Post a job', url: '/post-job' }],
      });
    }

    if (parsed.intent === 'help_customer_flow') {
      return res.json({
        success: true,
        intent: 'help_customer_flow',
        message: parsed.message,
        actions: Array.isArray(parsed.actions) ? parsed.actions : [
          { label: 'Post a job', url: '/post-job' },
          { label: 'My dashboard', url: '/dashboard/customer' },
        ],
      });
    }

    res.json({
      success: true,
      intent: 'general',
      message: parsed.message,
      actions: Array.isArray(parsed.actions) ? parsed.actions : [],
    });
  } catch (err) {
    // Graceful fallback if Gemini key not set
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key') {
      return res.json({
        success: true,
        intent: 'general',
        message: "I'm the ServiceHub AI assistant. Please configure your Gemini API key to enable AI features. You can browse professionals and post jobs directly from the site.",
        actions: [{ label: 'Browse professionals', url: '/professionals' }],
      });
    }
    next(err);
  }
};

module.exports = { chat };
