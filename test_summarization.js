const fetch = require("node-fetch");

async function testSummarization() {
    const apiKey = "de31e5eb334f04d4f04ebb64b6f18a4507dbd1de33bef0da07cf00a4878a67df"; // Use your real API key
    const text = "Today’s meeting discussed project updates and next steps.";

    const response = await fetch("https://api.together.xyz/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: "mistral-7b-instruct",
            messages: [{ role: "user", content: `Summarize: ${text}` }]
        })
    });

    const data = await response.json();
    console.log("AI Summary:", data);
}

testSummarization();
