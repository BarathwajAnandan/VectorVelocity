# VectorVelocity

VectorVelocity is a fun and interactive tool that gamifies the comparison of different AI language models' speeds. It visualizes the token generation speed of various AI providers in a racing game format.

## What it does

- Compares the speed of different AI models in generating text
- Visualizes the comparison as a car race
- Allows users to input custom prompts
- Supports multiple AI providers  (Groq, SambaNova, NVIDIA, TogetherAI  and more coming soon and you can also add your own!)
- Provides options for different race modes (instant or store-and-race)

## Setup

1. Clone the repository:
   ```
   git clone https://github.com/BarathwajAnandan/VectorVelocity.git
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up your environment variables:
   Create a `.env` file in the root directory and add your API keys:
   ```
   GROQ_API_KEY=your_groq_api_key
   SNOVA_API_KEY=your_sambanova_api_key
   TOGETHERAI_API_KEY=your_togetherai_api_key
   NVIDIA_API_KEY=your_nvidia_api_key
   ```

4. Run the application:
   ```
   npm start
   ```

## Who is it for?

VectorVelocity is designed for:
- AI enthusiasts who want to compare different language models
- Developers looking to choose the fastest AI provider for their projects
- Curious minds eager to explore AI model performance through an fun racing game.
- Anyone who wants to turn dry performance metrics into an adrenaline-pumping competition.

## Note

This is an early-stage project, and the code is still in development. Contributions, suggestions, and feedback are welcome!

## Adding Custom Endpoints or Providers

VectorVelocity is designed to be easily extensible. You can add your own endpoints or other providers (like AWS, Replicate, or self-hosted models) by following these steps:

1. Modify the `api_providers.json` file:
   Add a new entry for your provider, following the existing structure. For example:

   ```json
   "YOUR_PROVIDER": {
     "name": "Your Provider Name",
     "apiUrl": "https://your-api-endpoint.com/v1/chat/completions",
     "apiKey": "process.env.YOUR_PROVIDER_API_KEY",
     "models": [
       "model-name-1",
       "model-name-2"
     ],
     "selectedModel": "model-name-1",
     "makeApiCall": "makeYourProviderApiCall",
     "tokensPerSecondList": []
   }
   ```

2. Add the API key to your `.env` file if needed:
   ```
   YOUR_PROVIDER_API_KEY=your_api_key_here
   ```

3. Create an API call wrapper function in `groq.js`:
   Add a new function similar to the existing ones, like this:

   ```javascript
   async function makeYourProviderApiCall(prompt) {
     const headers = {
       'Authorization': `Bearer ${API_PROVIDERS.YOUR_PROVIDER.apiKey}`,
       'Content-Type': 'application/json'
     };
     
     const payload = {
       model: API_PROVIDERS.YOUR_PROVIDER.selectedModel,
       messages: [
         { role: 'system', content: 'You are a helpful assistant' },
         { role: 'user', content: prompt }
       ],
       stream: true
       // Add any other required parameters for your API
     };

     const response = await fetch(API_PROVIDERS.YOUR_PROVIDER.apiUrl, {
       method: 'POST',
       headers: headers,
       body: JSON.stringify(payload)
     });

     if (!response.ok) {
       throw new Error(`HTTP error! status: ${response.status}`);
     }

     return response.body.getReader();
   }
   ```

4. The application will automatically pick up the new provider from the `api_providers.json` file and include it in the race.

## Contributing

We welcome contributions to VectorVelocity! If you have suggestions for improvements or encounter any issues, please feel free to open an issue or submit a pull request.

⭐ If you like VectorVelocity, don't forget to star the repository!

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
