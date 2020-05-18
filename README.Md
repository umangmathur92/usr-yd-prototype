# RUN INSTRUCTIONS
- npm start
- app runs on port 5001

# Dependent services
- Azure Vision API
- IBM Max scene classifier
    - To run image: docker run -it -p 5000:5000 max-scene-classifier
    - Runs on port 5000
    - Instructions to build and run availaible on https://github.com/IBM/MAX-Scene-Classifier
- Question-answer generation model 
    - running on port 5003
