import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { SYSTEM_PROMPT, GENERATE_DISTRIBUTION_PROMPT } from '@/lib/agent/prompts';
import { Personnel, TeamConfig } from '@/types';

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
                rationale: "API 키가 설정되지 않아 **시뮬레이션 모드**로 동작합니다.\n\n사용자의 요청('운전자 우선 배정 등')을 분석한 결과, 각 팀의 밸런스를 위해 운전 가능 인원을 우선적으로 분산 배치하였습니다.",
                assignments: [], // Empty assignments means "Keep current or use default logic"
                logs: [
                    "[Simulation] 운전자 식별: 12명 확인",
                    "[Simulation] 각 팀에 1~2명씩 운전자 우선 배정",
                    "[Simulation] 남녀 성비 6:4 유지하며 나머지 인원 무작위 배정"
                ]
            };

            return NextResponse.json(mockResponse);
        }

        // 2. REAL AI MODE (Google Gemini)
        const genAI = new GoogleGenerativeAI(apiKey);

        // Define result schema
        const schema = {
            description: "Personnel distribution result",
            type: SchemaType.OBJECT,
            properties: {
                rationale: { type: SchemaType.STRING, description: "Explanation of distribution logic" },
                assignments: {
                    type: SchemaType.ARRAY,
                    items: {
                        type: SchemaType.OBJECT,
                        properties: {
                            personId: { type: SchemaType.STRING },
                            teamId: { type: SchemaType.STRING },
                            reason: { type: SchemaType.STRING }
                        },
                        required: ["personId", "teamId"]
                    }
                },
                logs: {
                    type: SchemaType.ARRAY,
                    items: { type: SchemaType.STRING }
                }
            },
            required: ["rationale", "assignments", "logs"]
        };

        // Use 'gemini-1.5-flash' as requested
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                responseMimeType: "application/json"
            }
        });

        // Simplify data to reduce token usage
        const simplifiedPersonnel = (personnel as Personnel[]).map(p => ({
            id: p.id,
            name: p.name,
            gender: p.gender,
            tags: p.tags,
            history: p.history
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
            Personnel Sample: ${JSON.stringify(simplifiedPersonnel.slice(0, 50))}... (Total ${simplifiedPersonnel.length})
            
            (Please process all personnel. If list is truncated here, assume full list is available in context or generate logic to handle them.)
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        if (!responseText) throw new Error("No response from AI");

        const parsedResult = JSON.parse(responseText) as AgentResponse;
        return NextResponse.json(parsedResult);

    } catch (error: any) {
        console.error("Agent Error:", error);

        // Pass the status code if available
        const status = error.status || 500;

        return NextResponse.json(
            { error: "AI Agent processing failed.", details: error.message },
            { status }
        );
    }
}
