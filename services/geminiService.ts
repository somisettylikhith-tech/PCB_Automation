import { GoogleGenerativeAI } from "@google/generative-ai";
import { DesignData } from "../types";

// Initialize Gemini (FIXED)
import.meta.env.VITE_API_KEY;
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

// Use a valid model
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash-latest",
});

export async function generateDesignFromPrompt(
  prompt: string,
  preferences?: string,
): Promise<DesignData> {
  const prefString = preferences
    ? `
    STRICT USER COMPONENT CONSTRAINTS:
    "${preferences}"
  `
    : "";

  const result = await model.generateContent(`
    You are an expert PCB Design Automation Engine (KiCad Edition).

    Task: Convert prompt to electronic design JSON.
    Prompt: "${prompt}"
    ${prefString}

    Output ONLY valid JSON with:
    - projectName
    - boardDimensions (width, height)
    - components
    - nets
  `);

  const text = result.response.text() || "{}";
  return JSON.parse(text) as DesignData;
}

export async function refineDesign(
  currentDesign: DesignData,
  userInstruction: string,
): Promise<DesignData> {
  const result = await model.generateContent(`
    Current Design: ${JSON.stringify(currentDesign)}
    User Instruction: "${userInstruction}"
    Modify and return FULL updated JSON PCB design.
  `);

  const text = result.response.text() || "{}";
  return JSON.parse(text) as DesignData;
}

export async function analyzeSchematicFile(
  fileName: string,
  content: string,
): Promise<DesignData> {
  const result = await model.generateContent(`
    Analyze this schematic content:
    ${content.substring(0, 1000)}

    Extract Bill of Materials and Netlist as JSON PCB design.
  `);

  const text = result.response.text() || "{}";
  return JSON.parse(text) as DesignData;
}
