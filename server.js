import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import admin from 'firebase-admin';
import { createRequire } from 'module';
import axios from 'axios';
import * as cheerio from 'cheerio';


// Use createRequire to import the JSON file in a compatible way
const require = createRequire(import.meta.url);
const serviceAccount = require('./serviceAccountKey.json');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin
try {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    const db = admin.firestore();
    console.log('✅ Firebase Admin initialized successfully.');
} catch (error)
{
    console.error('🔥 Firebase Admin initialization error:', error.message);
    process.exit(1);
}

// Initialize Google Generative AI
if (!process.env.GEMINI_API_KEY) {
    console.error('🔥 GEMINI_API_KEY is not set in the .env file.');
    process.exit(1);
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
console.log('✅ Google Generative AI initialized.');


// --- API ENDPOINTS ---

// GET all saved recipes
app.get('/get-recipes', async (req, res) => {
    try {
        const recipesCollection = admin.firestore().collection('recipes');
        // **THIS IS THE FIX**: Removed the .orderBy() to prevent indexing errors.
        // Sorting will now be handled on the client side.
        const snapshot = await recipesCollection.get();
        if (snapshot.empty) {
            return res.json([]);
        }
        const recipes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(recipes);
    } catch (error) {
        console.error('🔥 Error fetching recipes from Firestore:', error);
        res.status(500).json({ error: 'Failed to fetch recipes.' });
    }
});

// POST to scrape a recipe from a URL
app.post('/scrape-recipe', async (req, res) => {
    const { url } = req.body;
    if (!url) {
        return res.status(400).json({ error: 'URL is required.' });
    }
    console.log(`Scraping URL: ${url}`);

    try {
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        const $ = cheerio.load(data);
        let ingredients = [];

        $('script[type="application/ld+json"]').each((i, el) => {
            try {
                const json = JSON.parse($(el).html());
                const graph = json['@graph'] || [json]; 

                for (const item of graph) {
                    if (item['@type'] === 'Recipe' || (Array.isArray(item['@type']) && item['@type'].includes('Recipe'))) {
                        if (item.recipeIngredient && Array.isArray(item.recipeIngredient)) {
                            ingredients = item.recipeIngredient;
                            return false; 
                        }
                    }
                }
            } catch (e) {
                // Ignore parsing errors
            }
        });

        if (ingredients.length > 0) {
            console.log('✅ Extracted ingredients using structured JSON-LD data.');
            const cleanedIngredients = ingredients.map(ing => ing.replace(/\s\s+/g, ' ').trim());
            return res.json({ ingredients: cleanedIngredients });
        }

        console.log('⚠️ Structured data not found. Falling back to AI text extraction.');
        $('script, style').remove();
        const pageText = $('body').text().replace(/\s\s+/g, ' ').trim();

        if (!pageText) {
             return res.status(400).json({ error: 'Could not extract any text from the provided URL.' });
        }

        const modelName = 'gemini-2.5-flash-preview-05-20';
        const apiKey = process.env.GEMINI_API_KEY;
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
        const prompt = `From the following website text, extract only the cooking ingredients. List them in a single line, separated by commas. Ignore all other text like instructions, titles, and comments.\n\nWebsite Text:\n${pageText.substring(0, 15000)}`;

        const payload = { contents: [{ parts: [{ text: prompt }] }] };
        const apiResponse = await axios.post(apiUrl, payload, { headers: { 'Content-Type': 'application/json' } });
        const ingredientsText = apiResponse.data.candidates[0].content.parts[0].text;
        
        if (!ingredientsText) {
             return res.status(500).json({ error: 'AI could not identify ingredients from the website content.' });
        }
        
        const extractedIngredients = ingredientsText.split(',').map(item => item.trim()).filter(Boolean);
        res.json({ ingredients: extractedIngredients });

    } catch (error) {
        console.error('🔥 Error scraping recipe:', error.message);
        res.status(500).json({ error: `Failed to scrape recipe. The website may be blocking requests or the URL is invalid.` });
    }
});


// POST to generate a new recipe
app.post('/get-recipe', async (req, res) => {
    const { ingredients, time, diet, allergies, cookingStyle } = req.body;

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
        return res.status(400).json({ error: 'Ingredients are required and must be an array.' });
    }

    try {
        const modelName = 'gemini-2.5-flash-preview-05-20';
        const apiKey = process.env.GEMINI_API_KEY;
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

        let prompt = `Analyze the following request and return a valid JSON object with two top-level keys: "recipe" and "nutrition".
- The "nutrition" value must be a JSON object with keys for "calories", "protein", "carbs", and "fat". Each key's value must be an object with "value" (a number) and "unit" (a string).
- The "recipe" value must ALSO BE A JSON OBJECT with the following keys:
  - "title": A string for the recipe title.
  - "description": A short, engaging one-sentence string describing the dish.
  - "prepTime": A string for preparation time (e.g., "15 minutes").
  - "cookTime": A string for cooking time (e.g., "30 minutes").
  - "servings": A string for the number of servings (e.g., "4 servings").
  - "ingredients": An array of strings, with each string being one ingredient and its quantity.
  - "instructions": An array of strings, with each string being one step in the recipe.

Recipe Request Details:
- Ingredients: ${ingredients.join(', ')}
`;
        
        if (time && time !== 'Any') prompt += `- Max Cooking Time: ${time}\n`;
        if (diet && diet !== 'None') prompt += `- Dietary Preference: ${diet}\n`;
        if (allergies) prompt += `- Allergies to avoid: ${allergies}.\n`;
        if (cookingStyle) prompt += `- The recipe should be in the style of: ${cookingStyle}.\n`;
        
        const payload = { contents: [{ parts: [{ text: prompt }] }] };
        const apiResponse = await axios.post(apiUrl, payload, { headers: { 'Content-Type': 'application/json' } });

        let responseText = apiResponse.data.candidates[0].content.parts[0].text;
        responseText = responseText.replace(/```(json)?/g, '').trim();
        const sanitizedText = responseText.replace(/[\n\r]/g, '');
        const parsedData = JSON.parse(sanitizedText);
        const { recipe: recipeData, nutrition: nutritionData } = parsedData;

        if (!recipeData || !nutritionData) throw new Error("AI response was missing structured recipe or nutrition data.");
        
        const recipesCollection = admin.firestore().collection('recipes');
        const docRef = await recipesCollection.add({
            ingredients: ingredients,
            recipe: recipeData, 
            nutrition: nutritionData,
            createdAt: new Date(),
            customization: { time, diet, allergies, cookingStyle }
        });
        console.log('📝 Recipe saved to Firestore with ID:', docRef.id);

        res.json({ recipe: recipeData, nutrition: nutritionData });

    } catch (error) {
        console.error('🔥 Error generating recipe or saving to Firestore:', error);
        res.status(500).json({ error: `Failed to generate recipe: ${String(error)}` });
    }
});

app.listen(port, () => {
    console.log(`🚀 Server is running on http://localhost:${port}`);
});

