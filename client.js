//not a big fan of global variable, but to make it easier this time
var buildHtmlOutput = ""; //for rendering purpose
var loopCheck = new Set(); //set to have O(1) check time
var buildFinalCount = ""; //show the last variable
var totalPages = []; //store the data since the instruction is to get the all pages stored
//I am aware that global variable is bad, and I wont do it in the future, but I just want to make it more clearer
//Because it is so much easier to be read but dangerous because it can mixed up with other things

//function to render any found page
function renderResult(page) {
    buildHtmlOutput += '<li class="answer-process">'
    buildHtmlOutput += page;
    buildHtmlOutput += '<i class="fa fa-long-arrow-right" aria-hidden="true"></i>';
    buildHtmlOutput += '</li>';
    $(".list-of-answers").html(buildHtmlOutput);
}

//if we found any loop or philosophy we use this render without the second arrow
function renderLoopOrPhilosophyOrError(value) {
    buildHtmlOutput += '<li class="answer-process">'
    buildHtmlOutput += value;
    buildHtmlOutput += '</li>';
    $(".list-of-answers").html(buildHtmlOutput);
}

//render the final count
function renderFinalCount() {
    buildFinalCount += '<p>How many links you have been through to get there: </p>'
    buildFinalCount += '<p">'
    buildFinalCount += totalPages.length;
    buildFinalCount += '</p>';
    $(".total-pathway").html(buildFinalCount);
}
//the brain of the looping process
function doTheLoop(longText) {
    var container = [];

    //at first I did split until the second <p>('<p>',2) because I dont want to evaluate the whole string, but I found out that there are so many <p> inside the table or div
    //And some page doesnt have the answer from the main paragraph
    var array = longText.split('<p>');
    for (j = 1; j < array.length; j++) { //do the loop for each paragraph, I started with one because based on my research the first article should have been div or tab
        var currentBrackets = 0; //container if the link is inside the parenthesis or brackets
        var currentOpenBrackets = 0;
        var currentClosingBrackets = 0;
        var currentHref = 0; //tell the pointer which href is a good fit for us
        var paragraph = array[j]; //take which paragraph to be evaluated (many case return in the first loop)
        for (i = 0; i < paragraph.length; i++) {
            // if we find any distractions like brackets we want to add the value of the container
            if (paragraph[i] === '(' || paragraph[i] === '[') {
                currentOpenBrackets = i
                currentBrackets++
            }
            //if we find any suitable href (11=red link, 10=voice, and 19=language and interwikifile)
            else if (paragraph[i] === '<' && paragraph[i + 1] === 'a' && paragraph[i + 11] !== '/' && paragraph[i + 10] !== '/' && paragraph[i + 19] !== ':')

            {
                currentHref = i;
            }
            //in case we find the closing brackets, we can reduce the currentBrackets
            else if (paragraph[i] === ')' || paragraph[i] === ']') {
                currentClosingBrackets = i;
                currentBrackets--;
            }
            //as soon as we found out there is no brackets/parenthesis, we are valid and we go to the link and get the Page value
            //href+9 to avoid cite like [1] or [2]
            if ((currentHref > currentOpenBrackets) && (currentHref > currentClosingBrackets) && (paragraph[currentHref + 9] !== "#") && currentBrackets === 0) {
                //do the while loop to get the page
                while (paragraph[currentHref + 15] !== '\"') {
                    //push each one of the string to the array
                    container.push(paragraph[currentHref + 15])
                    currentHref++;
                }
                return (container.join("")); //break as soon we got it without iterating the rest of the loop and join them
            }
        }
    }
}

//there are many variation in the wikipedia page, whether there is a possible text without table or double table or many div pages
//trim will evaluate which paragraph should we go in which process
function trimURL(longText) {
    //first if statement evalute if there is no table or the table come after the first p, then we good to go to the next step
    if (longText.indexOf('<table') == -1 || (longText.indexOf('<table') > longText.indexOf('<p>'))) {
        return doTheLoop(longText);
    }
    //this is the tricky part
    else if (longText.indexOf('<table') < longText.indexOf('<p>')) { // we want to get out from <p> inside the tables if the table comes first
        var arrayTable = longText.split('</table>') // we split the table and kick the first table
            // I thought the problem would end, but apparently there are many pages that have multiple table stacking up
            // So I decided to take the long road by creating a loop here
        for (k = 1; k < arrayTable.length; k++) {
            var arrayOut = arrayTable[k]
                //we just want to evaluate those p inside <p>, but by splitting it with <table there might be the chance our <p is inside the <div
            if (arrayOut[2] === "p" || arrayOut[2] === "d") { // if its another table we dont do anything and skip it
                //same with the top process if we find the <p right after the table then we got the answer (unless there is no link in the first paragraph)
                if (arrayOut.indexOf('<div') < arrayOut.indexOf('<p') || arrayOut.indexOf('<p') < 0) { //lets say worst scenario there is a table and the next thing after that div
                    var arrayDiv = arrayOut.split('</div>') // we are pushed to split the div to get the <p easier
                    for (l = 0; l < arrayDiv.length; l++) { //created for loop to each case of div
                        arrayIn = arrayDiv[l]
                        if (arrayIn[2] === "p") { //but we only want to evaluate those array that have <p in it
                            return doTheLoop(arrayIn); // then we do the split at the bottom and doTheLoop function works
                        }
                    }
                } else {
                    return doTheLoop(arrayOut); // if everything is fine, (most of the time this part and the first if statement is whats gonna happen
                }
            }
        }
    }
    //to summarize the whole process. The program will be pretty fast toward pages with no table in front because the it will go to the loop and get the first paragraph and done.
    //the most complicated problem is actually animals and President Trump.
}


//This function is a simple ajax call with the value from the page
function getSearch(value) {
    $.ajax({
            type: "GET",
            dataType: "JSON",
            url: "https://en.wikipedia.org/w/api.php?action=parse&page=" + value + "&format=json&prop=text&origin=*&pllimit=max&callback=?"
        })
        .done(function (result) {
            //if we got the return we want to get the whole string
            var text = result.parse.text['*']; // get the value of the text
            var newURL = trimURL(text); //get the value of newURL from the trimming process
            if (newURL !== "Philosophy") { //if we dont get any philosophy do these things
                if (newURL === "undefined") { // if its undefined render error
                    renderLoopOrPhilosophyOrError('Ooopppsss We couldn\'t find it');
                }
                if (loopCheck.has(newURL)) { // if the set contain exactly the same page then its a loop
                    renderLoopOrPhilosophyOrError("LOOP!");
                } else {
                    loopCheck.add(newURL) // else add that specific page to the set
                    totalPages.push(newURL);
                    renderResult(newURL) //render the result
                    getSearch(newURL) //and do the recursion until we find the philosophy or fail
                }
            } else {
                renderLoopOrPhilosophyOrError("Philosophy") // we got it
                renderFinalCount();
            }
        })
        .fail(function (jqXHR, error, errorThrown) { //error return
            console.log(jqXHR);
            console.log(error);
            console.log(errorThrown);
            renderLoopOrPhilosophyOrError('Ooopppsss We couldn\'t find it')
        });
}

//this is what I want from document ready
$(document).ready(function () {
    $('.form-submit').submit(function (event) { // if someone press submit
        event.preventDefault(); //I dont want to refresh the whole thing
        loopCheck.clear(); // clear the previous set
        buildHtmlOutput = ""; //clear the previous rendering content
        buildFinalCount = ""; //show the last variable
        totalPages = null;
        totalPages = [];
        $(".list-of-answers").html(buildHtmlOutput);
        $(".total-pathway").html(buildFinalCount); //clear answer
        var url = $('#input-value').val() //get the value of the url
        var tempArray = url.split("/") //split for each of the url
        if (tempArray[tempArray.length - 2] !== "wiki" || tempArray[tempArray.length - 3] !== "en.wikipedia.org") { // if it is not a wikpedia page
            renderLoopOrPhilosophyOrError("Is this link a wikipedia page?"); //ask to reinput the value
        } else {
            getSearch(tempArray[tempArray.length - 1]) //if its valid then we good to go
        }
    });
    $("a").on('click', function (event) { //smooth scroll feature
        if (this.hash !== "") {
            // Prevent default anchor click behavior
            event.preventDefault();
            var hash = this.hash;
            $('html, body').animate({
                scrollTop: $(hash).offset().top
            }, 800, function () {
                window.location.hash = hash;
            });
        } // End if
    })
});
