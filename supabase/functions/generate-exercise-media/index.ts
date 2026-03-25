import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const res = await fetch(url, options);
    if (res.status === 429 && attempt < maxRetries - 1) {
      const delay = Math.pow(2, attempt + 1) * 2000 + Math.random() * 1000;
      console.log(`Rate limited, retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${maxRetries})`);
      await new Promise(r => setTimeout(r, delay));
      continue;
    }
    return res;
  }
  throw new Error("Max retries exceeded");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase env vars not configured");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { exerciseId, exerciseName, muscleGroup, equipment, instructions } = await req.json();
    if (!exerciseId || !exerciseName) {
      return new Response(JSON.stringify({ error: "exerciseId and exerciseName are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Generate exercise illustration image via Lovable AI
    const imagePrompt = `Professional fitness illustration showing the correct form and technique for the exercise "${exerciseName}". 
${muscleGroup ? `Target muscle group: ${muscleGroup}.` : ""}
${equipment ? `Equipment used: ${equipment}.` : ""}
Dark background with purple accent lighting. Clean, modern anatomical style showing a fit athlete performing the exercise with proper posture. 
Show muscle engagement areas highlighted in purple. Ultra high resolution, professional quality fitness illustration.`;

    const imageResponse = await fetchWithRetry("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: imagePrompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!imageResponse.ok) {
      const errText = await imageResponse.text();
      console.error("AI image generation failed:", imageResponse.status, errText);
      
      if (imageResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (imageResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI image generation failed [${imageResponse.status}]`);
    }

    const imageData = await imageResponse.json();
    const generatedImage = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    // 2. Generate detailed instructions via AI (text)
    const instructionsPrompt = `You are a professional fitness coach. Generate detailed exercise instructions in Portuguese (Brazil) for: "${exerciseName}".
${muscleGroup ? `Muscle group: ${muscleGroup}.` : ""}
${equipment ? `Equipment: ${equipment}.` : ""}

Return a JSON object with:
- "steps": array of strings, each a step-by-step instruction (4-6 steps)
- "tips": array of 2-3 pro tips for proper form
- "common_mistakes": array of 2-3 common mistakes to avoid
- "muscles_worked": array of muscle names targeted

Return ONLY valid JSON, no markdown.`;

    const textResponse = await fetchWithRetry("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: instructionsPrompt }],
      }),
    });

    let aiInstructions = null;
    if (textResponse.ok) {
      const textData = await textResponse.json();
      const content = textData.choices?.[0]?.message?.content ?? "";
      try {
        // Try to parse JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiInstructions = JSON.parse(jsonMatch[0]);
        }
      } catch {
        console.error("Failed to parse AI instructions JSON");
      }
    }

    // 3. Upload image to Supabase Storage if we have one
    let mediaUrl = null;
    if (generatedImage) {
      // Extract base64 data
      const base64Match = generatedImage.match(/^data:image\/(\w+);base64,(.+)$/);
      if (base64Match) {
        const ext = base64Match[1] === "jpeg" ? "jpg" : base64Match[1];
        const base64Data = base64Match[2];
        const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
        
        const filePath = `${exerciseId}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("exercise-media")
          .upload(filePath, binaryData, {
            contentType: `image/${base64Match[1]}`,
            upsert: true,
          });

        if (uploadError) {
          console.error("Upload error:", uploadError);
        } else {
          const { data: urlData } = supabase.storage
            .from("exercise-media")
            .getPublicUrl(filePath);
          mediaUrl = urlData.publicUrl;
        }
      }
    }

    // 4. Update exercise record with media_url and instructions
    const updateData: Record<string, any> = {};
    if (mediaUrl) updateData.media_url = mediaUrl;
    if (aiInstructions) updateData.instructions = JSON.stringify(aiInstructions);

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from("exercises")
        .update(updateData)
        .eq("id", exerciseId);
      if (updateError) console.error("Update exercise error:", updateError);
    }

    return new Response(JSON.stringify({
      success: true,
      media_url: mediaUrl,
      instructions: aiInstructions,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("generate-exercise-media error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
