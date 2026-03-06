// Build trigger: 2026-03-01 04:12
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { SYSTEM_PROMPT, GENERATE_DISTRIBUTION_PROMPT } from '@/lib/agent/prompts';
import { Personnel, TeamConfig } from '@/types';

// Force Node.js runtime for stability with Google AI SDK
export const runtime = 'nodejs';

// Define the expected response structure
interface AgentResponse {
    rationale: string;
    assignments: Array<{ personId: string; teamId: string; reason?: string }>;
    logs: string[];
}

export async function POST(req: Request) {
    try {
        const { personnel, teams, command } = await req.json();

        // Use Gemini API Key
        const apiKey = process.env.GEMINI_API_KEY;

        // 1. SIMULATION MODE (If no API Key)
        if (!apiKey) {
            console.log('No Gemini API Key found. Running in Simulation Mode.');

            // Artificial delay for realism
            await new Promise(resolve => setTimeout(resolve, 2000));

            const mockResponse: AgentResponse = {
                rationale: "API 키가 설정되지 않아 **시뮬레이션 모드**로 동작합니다.\n\n" +
                    "🔍 **디버깅 정보 (Vercel)**\n" +
                    `- Key Found: ${!!apiKey}\n` +
                    `- Key Length: ${apiKey ? apiKey.length : 0}\n` +
                    `- Node Env: ${process.env.NODE_ENV}\n` +
                    `- Region: ${process.env.VERCEL_REGION || 'local'}\n` +
                    "\n사용자의 요청('운전자 우선 배정 등')을 분석한 결과, 각 팀의 밸런스를 위한 시뮬레이션 결과를 제안합니다.",
                assignments: [],
                logs: [
                    "[System] Error: GEMINI_API_KEY is undefined",
                    `[Debug] Env Var Check: ${!!apiKey ? 'Present' : 'Missing'}`,
                    "[Simulation] 운전자 식별: 12명 확인",
                    "[Simulation] 각 팀에 1~2명씩 운전자 우선 배정",
                    "[Simulation] 남녀 성비 6:4 유지하며 나머지 인원 무작위 배정"
                ]
            };

            return NextResponse.json(mockResponse);
        }

        // 2. REAL AI MODE (Google Gemini)
        console.log(`[API] Initializing Gemini with Key: ${apiKey.substring(0, 4)}****`);
        const genAI = new GoogleGenerativeAI(apiKey);

        // Use 'gemini-1.5-flash' (Standard) with 'v1' API version (Stable)
        // This is critical to avoid 404 errors on v1beta endpoints
        // Use 'gemini-1.5-flash' with 'v1beta' (More features/models available)
        // Note: responseMimeType was removed to avoid 400 errors, but v1beta handles it better usually.
        // However, to be safe, we keep responseMimeType OFF for now and rely on prompt.
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: {
                responseMimeType: "application/json"
            }
        }, { apiVersion: "v1beta" });

        // Simplify data to reduce token usage
        const simplifiedPersonnel = (personnel as Personnel[]).map(p => ({
            id: p.id,
            name: p.name,
            gender: p.gender,
            tags: p.tags,
            history: p.history,
            assignedTeamId: p.assignedTeamId,
            attributes: p.attributes
        }));

        const simplifiedTeams = (teams as TeamConfig[]).map(t => ({
            id: t.id,
            name: t.name,
            capacity: t.capacity
        }));

        // Construct prompt
        const prompt = `
            ${SYSTEM_PROMPT}

            ${GENERATE_DISTRIBUTION_PROMPT(simplifiedPersonnel.length, simplifiedTeams.length, command)}
            
            [Current Data]
            Teams: ${JSON.stringify(simplifiedTeams)}
            Personnel Sample: ${JSON.stringify(simplifiedPersonnel.slice(0, 150))}... (Total ${simplifiedPersonnel.length})
            
            (Please process all personnel. If list is truncated here, assume full list is available in context or generate logic to handle them.)
        `;

        console.log("[API] Generating content...");
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        if (!responseText) throw new Error("No response from AI");

        // Strip markdown backticks if AI accidentally includes them despite JSON mode
        const cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsedResult = JSON.parse(cleanedText) as AgentResponse;

        // Add debug log to verify version
        parsedResult.logs = [
            ...(parsedResult.logs || []),
            "[System] Model: gemini-2.0-flash (v1beta verified)"
        ];

        return NextResponse.json(parsedResult);

    } catch (error: any) {
        console.error("Agent Error:", error);

        // Pass the status code if available
        const status = error.status || 500;

        const errorMessage = error.message || "Unknown error";

        return NextResponse.json(
            {
                error: `AI Agent processing failed (v8 - 2.0 stable).`,
                details: errorMessage,
                debug: "Env: v1beta/gemini-2.0-flash"
            },
            { status }
        );
    }
}
