import { NextResponse } from "next/server";
import { fail } from "@/lib/response";
import { getAuthenticatedUser } from "@/lib/api-auth";

export async function POST(request: Request) {
  try {
    const caller = getAuthenticatedUser(request);
    if (!caller) return fail("Authentication required.", 401);

    const { messages } = await request.json();
    if (!messages || !Array.isArray(messages)) {
      return fail("Messages array is required.", 400);
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL || "deepseek/deepseek-v4-flash";

    const systemPrompt = {
      role: "system",
      content: `You are NexGro Schemes & Insurance AI, a specialized assistant for Indian farmers.
You have expert knowledge about:

GOVERNMENT SCHEMES:
1. PM-KISAN (Pradhan Mantri Kisan Samman Nidhi) - ₹6000/year income support, pmkisan.gov.in
2. PMFBY (PM Fasal Bima Yojana) - Crop insurance, 2% kharif/1.5% rabi premium, pmfby.gov.in
3. KCC (Kisan Credit Card) - Credit up to ₹3 lakh at 4% interest, nabard.org
4. PMKSY (PM Krishi Sinchayee Yojana) - Irrigation subsidy up to 65%, pmksy.gov.in
5. eNAM (National Agriculture Market) - Electronic trading portal, enam.gov.in
6. RKVY (Rashtriya Krishi Vikas Yojana) - State agricultural development, rkvy.nic.in
7. SMAM - Farm machinery subsidy scheme
8. Soil Health Card Scheme - Free soil testing
9. PM Kisan MaanDhan Yojana - Pension ₹3000/month at age 60

INSURANCE PLANS:
1. PMFBY Kharif - 2% premium, crop loss coverage
2. PMFBY Rabi - 1.5% premium, winter crops
3. RWBCIS - Weather-based crop insurance, auto-triggered by IMD data
4. AIC Varsha Bima - Rainfall index insurance, aicofindia.com
5. NIA Krishi Raksha - Up to ₹50 lakh per crop, nationalinsurance.nic.co.in
6. LIC Jeevan Shanthi - Life cover + pension for farmers, licindia.in
7. United India Crop Insurance - Comprehensive crop coverage

HELPLINES:
- PM-KISAN: 155261 / 011-23381092
- PMFBY: 1800-180-1551
- Kisan Call Centre: 1800-180-1551
- NABARD: 022-26539895
- AIC: 1800-116-515

Always:
- Mention official website links (gov.in portals)
- Explain eligibility clearly
- List required documents
- Explain claim process step by step
- Use bullet points and clear formatting
- Answer in simple, farmer-friendly language
- If asked in regional context, mention state-specific helplines`
    };

    const formattedMessages = [
      systemPrompt,
      ...messages.map((m: { sender: string; text: string }) => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.text,
      })),
    ];

    if (!apiKey) {
      return NextResponse.json({
        success: true,
        text: "I can help with farmer schemes & insurance! Please ask about PM-KISAN, PMFBY, KCC, PMKSY, eNAM or any insurance plan. (AI key not configured — using built-in knowledge)",
        isFallback: true,
      });
    }

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "NexGro Schemes & Insurance AI",
        },
        body: JSON.stringify({
          model,
          messages: formattedMessages,
          temperature: 0.6,
          max_tokens: 1200,
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) throw new Error(`OpenRouter error: ${response.status}`);

      const result = await response.json();
      const aiResponse = result.choices?.[0]?.message?.content;
      if (!aiResponse) throw new Error("Empty response");

      return NextResponse.json({ success: true, text: aiResponse.trim(), isFallback: false });
    } catch (apiError) {
      console.error("Schemes AI API error:", apiError);
      return NextResponse.json({
        success: true,
        text: "I'm having trouble connecting to the AI service right now. Please try again in a moment. Meanwhile, you can browse the scheme cards on the left for detailed information and official website links.",
        isFallback: true,
      });
    }
  } catch (error) {
    console.error("Schemes AI route error:", error);
    return fail("Unexpected error in schemes AI.", 500);
  }
}
