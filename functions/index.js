require('dotenv').config();

const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const Alexa = require('ask-sdk-core');
const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();
const db = admin.firestore();


exports.pubsub = onSchedule("0 */8 * * *", async (event) => {
    try {
        const apiKey = process.env.WEATHER_API_KEY;
        const city = "Missoula";

        const response = await axios.get(
            `http://api.weatherstack.com/current?access_key=${apiKey}&query=${city}`
        );

        const weather = response.data;

        await db.collection("weather").add({
            location: weather.location.name,
            region: weather.location.region,
            country: weather.location.country,
            temperature: weather.current.temperature,
            description: weather.current.weather_descriptions[0],
            humidity: weather.current.humidity,
            wind_speed: weather.current.wind_speed,
            feelslike: weather.current.feelslike,
            timestamp: new Date(),
        });

        console.log("Weather data saved successfully!");
    } catch (error) {
        console.error("Error fetching or saving weather data:", error);
    }
});

// LaunchRequestHandler: Greets the user
const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
  },
  handle(handlerInput) {
    const speakOutput = 'Welcome to My Skill. Ask me for a fact.';
    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  }
};

// GetFactIntentHandler: Returns a random fact
const GetFactIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetFactIntent';
  },
  handle(handlerInput) {
    const facts = [
      'A bolt of lightning contains enough energy to toast 100,000 slices of bread.',
      'You can\'t hum while holding your nose.',
      'The total weight of ants on Earth once equaled the total weight of all humans.',
      'Wombat poop is cube-shaped.'
    ];
    const randomFact = facts[Math.floor(Math.random() * facts.length)];
    
    return handlerInput.responseBuilder
      .speak(randomFact)
      .getResponse();
  }
};

// CancelAndStopIntentHandler: Handles cancel/stop
const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
        || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak('Goodbye!')
      .getResponse();
  }
};

// ErrorHandler: Handles errors
const ErrorHandler = {
  canHandle() { return true; },
  handle(handlerInput, error) {
    console.error(`Error: ${error.message}`);
    return handlerInput.responseBuilder
      .speak('Sorry, I had trouble connecting to my Firebase brain.')
      .getResponse();
  }
};


const skillBuilder = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    GetFactIntentHandler,
    CancelAndStopIntentHandler
  )
  .addErrorHandlers(ErrorHandler)
  .create();


// Original helloWorld function
exports.helloWorld = onRequest((request, response) => {
  logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase!");
});

// Alexa Skill function
exports.alexaSkill = onRequest(async (request, response) => {
  try {
    const responseEnvelope = await skillBuilder.invoke(request.body);
    response.send(responseEnvelope);
  } catch (error) {
    console.error(error);
    response.status(500).send('Error processing the Alexa request');
  }
});