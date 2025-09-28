import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import admin from 'firebase-admin';
import { createRequire } from 'module';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { createHash } from 'crypto';

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


// --- RECIPE API ENDPOINTS ---

// GET all saved recipes
app.get('/get-recipes', async (req, res) => {
    try {
        const recipesCollection = admin.firestore().collection('recipes');
        const snapshot = await recipesCollection.orderBy('createdAt', 'desc').get();
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

// GET a list of ingredients for a given dish name
app.post('/get-ingredients-for-dish', async (req, res) => {
    const { dishName } = req.body;
    if (!dishName) {
        return res.status(400).json({ error: 'Dish name is required.' });
    }

    try {
        const modelName = 'gemini-2.5-flash-preview-05-20';
        const apiKey = process.env.GEMINI_API_KEY;
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
        
        const prompt = `List the essential ingredients for making ${dishName}. Return the response as a single, comma-separated string. For example: "Ingredient 1, Ingredient 2, Ingredient 3"`;
        
        const payload = { contents: [{ parts: [{ text: prompt }] }] };
        const apiResponse = await axios.post(apiUrl, payload, { headers: { 'Content-Type': 'application/json' } });
        const ingredientsText = apiResponse.data.candidates[0].content.parts[0].text;
        
        const ingredients = ingredientsText.split(',').map(item => item.trim()).filter(Boolean);
        res.json({ ingredients });

    } catch (error) {
        console.error('🔥 Error getting ingredients for dish:', error);
        res.status(500).json({ error: `Failed to get ingredients for ${dishName}.` });
    }
});


// POST to generate a new recipe or update an existing one
app.post('/get-recipe', async (req, res) => {
    const { ingredients, time, diet, allergies, cookingStyle } = req.body;

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
        return res.status(400).json({ error: 'Ingredients are required and must be an array.' });
    }

    try {
        const sortedIngredients = [...ingredients].sort().join(',');
        const customizationString = `${time}|${diet}|${allergies}|${cookingStyle}`;
        const requestString = `${sortedIngredients}#${customizationString}`;
        const uniqueKey = createHash('sha256').update(requestString).digest('hex');

        const recipesCollection = admin.firestore().collection('recipes');
        const query = recipesCollection.where('uniqueKey', '==', uniqueKey).limit(1);
        const snapshot = await query.get();

        if (!snapshot.empty) {
            console.log('✅ Found existing recipe. Incrementing generation count.');
            const existingDoc = snapshot.docs[0];
            const recipeRef = recipesCollection.doc(existingDoc.id);

            await recipeRef.update({
                generationCount: admin.firestore.FieldValue.increment(1)
            });

            const updatedDoc = await recipeRef.get();
            return res.json({ id: updatedDoc.id, ...updatedDoc.data() });
        }
        
        console.log('📝 No existing recipe found. Generating a new one.');
        const modelName = 'gemini-2.5-flash-preview-05-20';
        const apiKey = process.env.GEMINI_API_KEY;
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

        let prompt = `Analyze the following request and return a valid JSON object with two top-level keys: "recipe" and "nutrition".
- The "nutrition" value must be a JSON object with keys for "calories", "protein", "carbs", and "fat". Additionally, include keys for "vitaminC", "iron", and "calcium" if they are present in significant amounts. Each key's value must be an object with "value" (a number) and "unit" (a string, e.g., "g", "mg", "kcal").
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
        
        let parsedData;
        try {
            parsedData = JSON.parse(responseText.replace(/[\n\r]/g, ''));
        } catch (e) {
            console.warn("⚠️ Initial JSON parse failed. Attempting to self-correct...");
            const fixupPrompt = `The following JSON is broken. Please fix it and return only the valid JSON object.\n\nBroken JSON:\n${responseText}`;
            const fixupPayload = { contents: [{ parts: [{ text: fixupPrompt }] }] };
            const fixupResponse = await axios.post(apiUrl, fixupPayload, { headers: { 'Content-Type': 'application/json' } });
            
            let fixedText = fixupResponse.data.candidates[0].content.parts[0].text;
            fixedText = fixedText.replace(/```(json)?/g, '').trim();
            parsedData = JSON.parse(fixedText.replace(/[\n\r]/g, ''));
            console.log("✅ AI successfully self-corrected the JSON.");
        }
        
        const { recipe: recipeData, nutrition: nutritionData } = parsedData;

        if (!recipeData || !nutritionData) throw new Error("AI response was missing data.");

        const recipePayload = {
            ingredients: ingredients,
            recipe: recipeData,
            nutrition: nutritionData,
            createdAt: new Date(),
            customization: { time, diet, allergies, cookingStyle },
            isFavourite: false,
            generationCount: 1,
            uniqueKey: uniqueKey
        };

        const docRef = await recipesCollection.add(recipePayload);
        console.log('📝 New recipe saved to Firestore with ID:', docRef.id);

        res.json({ id: docRef.id, ...recipePayload });

    } catch (error) {
        console.error('🔥 Error generating/updating recipe:', error);
        res.status(500).json({ error: `Failed to process recipe: ${String(error)}` });
    }
});

// GET popular recipes
app.get('/get-popular-recipes', async (req, res) => {
    try {
        const recipesCollection = admin.firestore().collection('recipes');
        const snapshot = await recipesCollection.orderBy('generationCount', 'desc').limit(5).get();
        if (snapshot.empty) {
            return res.json([]);
        }
        const recipes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(recipes);
    } catch (error) {
        console.error('🔥 Error fetching popular recipes:', error);
        res.status(500).json({ error: 'Failed to fetch popular recipes.' });
    }
});

// GET favourite recipes
app.get('/get-favourite-recipes', async (req, res) => {
    try {
        const recipesCollection = admin.firestore().collection('recipes');
        const snapshot = await recipesCollection.where('isFavourite', '==', true).orderBy('createdAt', 'desc').get();
        if (snapshot.empty) {
            return res.json([]);
        }
        const recipes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(recipes);
    } catch (error) {
        console.error('🔥 Error fetching favourite recipes:', error);
        res.status(500).json({ error: 'Failed to fetch favourite recipes.' });
    }
});

// POST to toggle a recipe's favourite status
app.post('/recipes/:id/favourite', async (req, res) => {
    const { id } = req.params;
    const { isFavourite } = req.body;

    if (typeof isFavourite !== 'boolean') {
        return res.status(400).json({ error: 'isFavourite must be a boolean.' });
    }

    try {
        const recipeRef = admin.firestore().collection('recipes').doc(id);
        await recipeRef.update({ isFavourite });
        console.log(`✅ Toggled favourite for recipe ${id} to ${isFavourite}`);
        res.json({ success: true, message: `Recipe ${id} updated.` });
    } catch (error) {
        console.error(`🔥 Error toggling favourite for recipe ${id}:`, error);
        res.status(500).json({ error: 'Failed to update recipe favourite status.' });
    }
});


// --- FORUM API ENDPOINTS ---

// GET all posts
app.get('/posts', async (req, res) => {
    try {
        const postsCollection = admin.firestore().collection('posts');
        const snapshot = await postsCollection.orderBy('createdAt', 'desc').get();
        if (snapshot.empty) {
            return res.json([]);
        }
        const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(posts);
    } catch (error) {
        console.error('🔥 Error fetching posts:', error);
        res.status(500).json({ error: 'Failed to fetch posts.' });
    }
});

// POST a new post
app.post('/posts', async (req, res) => {
    const { title, content, author } = req.body;
    if (!title || !content || !author) {
        return res.status(400).json({ error: 'Title, content, and author are required.' });
    }

    try {
        const postsCollection = admin.firestore().collection('posts');
        const newPost = {
            title,
            content,
            author,
            createdAt: new Date(),
            comments: []
        };
        const docRef = await postsCollection.add(newPost);
        console.log('📝 New post created with ID:', docRef.id);
        res.status(201).json({ id: docRef.id, ...newPost });
    } catch (error) {
        console.error('🔥 Error creating post:', error);
        res.status(500).json({ error: 'Failed to create post.' });
    }
});

// POST a new comment on a post
app.post('/posts/:id/comments', async (req, res) => {
    const { id } = req.params;
    const { text, author } = req.body;

    if (!text || !author) {
        return res.status(400).json({ error: 'Comment text and author are required.' });
    }

    try {
        const postRef = admin.firestore().collection('posts').doc(id);
        const newComment = {
            text,
            author,
            createdAt: new Date()
        };

        await postRef.update({
            comments: admin.firestore.FieldValue.arrayUnion(newComment)
        });
        
        const updatedPostDoc = await postRef.get();
        if (!updatedPostDoc.exists) {
            return res.status(404).json({ error: 'Post not found after update.' });
        }

        console.log(`💬 New comment added to post ${id}`);
        res.json({ id: updatedPostDoc.id, ...updatedPostDoc.data() });

    } catch (error) {
        console.error(`🔥 Error adding comment to post ${id}:`, error);
        res.status(500).json({ error: 'Failed to add comment.' });
    }
});


app.listen(port, () => {
    console.log(`🚀 Server is running on http://localhost:${port}`);
});

