import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productName, productDescription, categories, categoryAttributes } = await req.json();

    if (!productName || !categories || categories.length === 0) {
      return new Response(
        JSON.stringify({ error: "Product name and categories are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const categoryList = categories.map((c: { id: string; name: string }) => `- ${c.name} (ID: ${c.id})`).join("\n");

    const prompt = `You are a product data specialist for e-commerce marketplaces. Based on the product information provided, analyze and generate comprehensive product listing data.

Product Name: ${productName}
${productDescription ? `Existing Description: ${productDescription}` : ""}

Available Categories:
${categoryList}

Your task is to generate product listing data. Return a JSON object with this EXACT structure:
{
  "categoryId": "select the most appropriate category ID from the list above",
  "attributes": {
    "title": "An optimized, SEO-friendly product title (max 200 chars)",
    "description": "A compelling 2-3 sentence product description highlighting key benefits",
    "brand": "The brand name extracted from the product name, or a reasonable suggestion",
    "bullet_1": "First key feature or benefit (no bullet character, just the text)",
    "bullet_2": "Second key feature or benefit",
    "bullet_3": "Third key feature or benefit",
    "bullet_4": "Fourth key feature or benefit",
    "bullet_5": "Fifth key feature or benefit",
    "keywords": "comma-separated search keywords for discoverability"
  }
}

IMPORTANT RULES:
1. For bullet points, provide ONLY the text content without bullet characters (no •, -, or *)
2. Each bullet point should be a complete feature description
3. Generate all 5 bullet points with meaningful content
4. The title should be clear and include the brand if identifiable
5. Keywords should be relevant search terms separated by commas
6. Return ONLY valid JSON, no markdown or extra text`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a product data specialist. Always return valid JSON only, no markdown formatting or code blocks." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add credits to your account." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content?.trim() || "";
    
    // Clean up the response - remove markdown code blocks if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    console.log("AI response content:", content);

    let result;
    try {
      result = JSON.parse(content);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      // Fallback: try to extract category ID at minimum
      const categoryMatch = content.match(/"categoryId"\s*:\s*"([^"]+)"/);
      result = {
        categoryId: categoryMatch ? categoryMatch[1] : categories[0].id,
        attributes: {}
      };
    }

    // Validate that the suggested category ID exists
    const validCategory = categories.find((c: { id: string }) => c.id === result.categoryId);

    return new Response(
      JSON.stringify({
        suggestedCategoryId: validCategory ? result.categoryId : categories[0].id,
        suggestedAttributes: result.attributes || {},
        isValid: !!validCategory,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("suggest-category error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
