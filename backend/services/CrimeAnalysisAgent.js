const { GoogleGenerativeAI } = require("@google/generative-ai");

class CrimeAnalysisAgent {
    constructor() {
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
        this.context = [];
    }

    async analyzeCrimePatterns(query, crimeData) {
        const prompt = `
        As a crime analysis expert, analyze the following crime data:
        ${JSON.stringify(crimeData)}
        
        User Query: ${query}
        
        Provide insights about:
        1. Crime patterns and trends
        2. Geographic hotspots
        3. Temporal patterns
        4. Safety recommendations
        
        Format the response in a clear, structured way with bullet points and clear sections.
        `;

        const result = await this.model.generateContent(prompt);
        return result.response.text();
    }

    async generateSafetyReport(location, crimeData) {
        const prompt = `
        Generate a safety report for location: ${location}
        Based on crime data: ${JSON.stringify(crimeData)}
        
        Include:
        1. Safety score (1-10)
        2. Risk factors
        3. Prevention recommendations
        4. Emergency contacts
        5. Community resources
        
        Format the response in a clear, structured way with sections and bullet points.
        `;

        const result = await this.model.generateContent(prompt);
        return result.response.text();
    }

    async getCrimeInsights(crimeType, data) {
        const prompt = `
        Analyze the following ${crimeType} data:
        ${JSON.stringify(data)}
        
        Provide:
        1. Key statistics
        2. Notable patterns
        3. Risk factors
        4. Prevention strategies
        
        Format the response in a clear, structured way with sections and bullet points.
        `;

        const result = await this.model.generateContent(prompt);
        return result.response.text();
    }
}

module.exports = new CrimeAnalysisAgent(); 