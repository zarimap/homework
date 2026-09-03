import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenAI } from "https://esm.run/@google/genai"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set in Supabase Secrets.')
    }

    const { prompt, imageBase64, mimeType } = await req.json()
    const ai = new GoogleGenAI({ apiKey })

    const contents: any[] = [prompt]
    if (imageBase64 && mimeType) {
      contents.push({
        inlineData: {
          mimeType: mimeType,
          data: imageBase64
        }
      })
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: { responseMimeType: 'application/json' }
    })

    return new Response(
      JSON.stringify({ text: response.text }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error: any) {
    console.error('Edge Function Error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
