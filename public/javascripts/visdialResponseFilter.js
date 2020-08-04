let listOfWordsToFilter = new Set(["<unk>", "can\'t tell", "i can\'t tell"]);
let listOfSentencesToFilter = new Set(["can\'t tell", "i can\'t tell"]);

async function filterResponse(input){
    let sentences = input.split('.');
    let output = "";

    for(let i = 0; i < sentences.length; i++){
        
        let sentence = sentences[i];
        let words = sentence.split(" ");

        if(listOfSentencesToFilter.has(sentence)){
            output += ("Chat bot is unable to answer. ");
            continue;
        }

    for(let j = 0; j < words.length; j++){
        
        let word = words[j];
        if(listOfWordsToFilter.has(word)){
            output += ("Chat bot is unable to answer. ");
            break;
        }
        if (j == words.length - 1){
            output += sentence;
            output += ". ";
        }
        
    }
}

    return output;
}

