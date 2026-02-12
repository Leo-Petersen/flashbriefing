const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const Alexa = require('ask-sdk-core');


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