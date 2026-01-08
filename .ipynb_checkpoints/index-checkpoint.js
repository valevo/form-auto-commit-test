/////////////////////////////////////////////////////////
//// VARIABLES
/////////////////////////////////////////////////////////


const RAs = {};


/////////////////////////////////////////////////////////
//// HELPERS
/////////////////////////////////////////////////////////

function askGitHubToken() {
    let token = prompt("Please enter the GitHub Personal-Access Token (classic):", "");
    if (!(token == null || token == "")) {
        document.getElementById("gh-pat").value = token;
        return token;
    }   
}

async function getOctokit() {
    var token = document.getElementById("gh-pat").value;
    if (token == null || token == "") {
        var token = askGitHubToken();
    }

    var octokitModule = await import("https://esm.sh/@octokit/core");
    var octokit = new octokitModule.Octokit({auth: token});
    return octokit;
}

function getBasicData() {
    var level = document.getElementById("level").value;
    var lang = document.getElementById("language").value;
    var title = document.getElementById("title").value;

    return level, lang, title;

}

/////////////////////////////////////////////////////////
//// BASIC FUNCTIONS
/////////////////////////////////////////////////////////

async function loadPage() {
    // askGitHubToken();
    getTitles();
}


/////////////////////////////////////////////////////////
//// FETCHING DATA
/////////////////////////////////////////////////////////

async function listRAs(level, language){
    var octokit = await getOctokit();
    // var langEN = (language == 'English') ? 'English' : 'Dutch'; 
    var path = `published/niveau${level}/${language}/`
    var folderContents = await octokit.request('GET /repos/valevo/form-auto-commit-test/contents/'+path, {
  owner: 'OWNER',
  repo: 'form-auto-commit-test',
  path: path,
  headers: {
    'X-GitHub-Api-Version': '2022-11-28'
  }
});
    console.log(folderContents);
    return folderContents.data;
}

async function getRAContents(level, lang, fileName) {
    var octokit = await getOctokit();

    var filePath = `published/niveau${level}/${lang}/${fileName}`;
    var file = await octokit.request('GET /repos/valevo/form-auto-commit-test/contents/'+filePath, {
          owner: 'OWNER',
          repo: 'form-auto-commit-test',
          path: filePath,
          headers: {
            'X-GitHub-Api-Version': '2022-11-28'
          }
        });

    function decodeBase64(base64) {
        // this function is from
        // https://stackoverflow.com/questions/30106476/using-javascripts-atob-to-decode-base64-doesnt-properly-decode-utf-8-strings
        const text = atob(base64);
        const length = text.length;
        const bytes = new Uint8Array(length);
        for (let i = 0; i < length; i++) {
            bytes[i] = text.charCodeAt(i);
        }
        const decoder = new TextDecoder(); // default is utf-8
        return decoder.decode(bytes);
    }

    // the problem with "pure" atob() is that it doesn't work with UTF-8 characters 
    // (since they occupy more than byte?) 
    // var rawYAMLString = atob(file.data.content).replace('\r', '');
    var rawYAMLString = decodeBase64(file.data.content).replace('\r', '');
    var RAContent = jsyaml.load(rawYAMLString);

    return RAContent;
}


function fillTitleOptions(titleList) {
    var options = document.getElementById('matching-RAs');
    options.innerHTML = '';
    for (const title of titleList) {
        var option = document.createElement('option');
        option.value = title;
        options.appendChild(option);
    }
}

async function getTitles() {
    var lang = document.getElementById("language").value;
    var level = document.getElementById("level").value;

    var filenames = await listRAs(level, lang);
    var curTitles = []
    for (const fileObj of filenames) {
        var RAContents = await getRAContents(level, lang, fileObj.name);
        RAs[RAContents.Title] = [level, lang, fileObj.name];
        curTitles.push(RAContents.Title);
        console.log(RAContents.Title);
    }
    fillTitleOptions(curTitles);
    console.log(RAs);
    return filenames;
}


async function autoFill() {
    // await getTitles(); // not needed here because getTitles() gets called on change of level and language 
    var level, lang, title = getBasicData();
    if (title == "") {
        return ;
    }
    var [savedLevel, savedLang, savedFilename] = RAs[title];
    // alert([savedLevel, savedLang, savedFilename]);
    var curRAConent = await getRAContents(savedLevel, savedLang, savedFilename);
    console.log(curRAConent);
    console.log(Object.keys(curRAConent));
    var container = document.getElementById("auto-fill-container");
    container.innerHTML = "";
    for (const [k, value] of Object.entries(curRAConent)) {
        var curLabel = document.createElement('label');
        curLabel.for = k;
        curLabel.innerHTML = `${k}:   `;
        container.appendChild(curLabel);
        var curText = document.createElement('textarea');
        curText.id = k;
        curText.value = value; //JSON.parse(value); //JSON.stringify(value);
        container.appendChild(curText);
        console.log(k);
        var mybr = document.createElement('br');
        container.appendChild(mybr);
    }

    var infoContainer = document.getElementById("info-container");
    infoContainer.innerHTML = "";
    var iframe = document.createElement("iframe");
    iframe.src = "https://research-aids.github.io//published/niveau2/Dutch/MilitaryAndNavy.html";
    iframe.height = "100%";
    iframe.width = "100%";
    iframe.frameBorder="0"
    infoContainer.appendChild(iframe);
    
    
 
}


// async function autoFill() {
//     var level, lang, title = getBasicData();
//     if (title == "") {
//         return ;
//     }
//     var [savedLevel, savedLang, savedFilename] = RAs[title];
//     var curRAConent = await getRAContents(savedLevel, savedLang, savedFilename);
//     curRAConent = jsyaml.dump(curRAConent);
//     var infoContainer = document.getElementById("info-container");
//     alert(curRAConent);
//     infoContainer.innerHTML = curRAConent;
//     return curRAConent; 
// }
    
    

/////////////////////////////////////////////////////////
//// UPLOADING
/////////////////////////////////////////////////////////

function getBlob(text) {
    var data = new Blob([text], {type: 'text/plain'});

    // If we are replacing a previously generated file we need to
    // manually revoke the object URL to avoid memory leaks.
    // if (textFile !== null) {
    //   window.URL.revokeObjectURL(textFile);
    // }

    textFile = window.URL.createObjectURL(data);

    // returns a URL you can use as a href
    return textFile;
}


async function uploadToGithub(title, text) {
    var filename = `${title}.yml`;
    var octokit = await getOctokit();
    var response = await octokit.request(`PUT /repos/valevo/form-auto-commit-test/contents/${filename}`, {
                              owner: 'valevo',
                              repo: 'form-auto-commit-test',
                              path: filename,
                              message: 'first commit by Octokit',
                              committer: {
                                name: 'vale',
                                email: 'valevogelmann@gmail.com'
                              },
                              content: btoa(text),
                              headers: {
                                'X-GitHub-Api-Version': '2022-11-28'
                              }
                            });
    return response;
}

function assembleRA(lang, level, title) {
    return `Language: ${lang}

Level: ${level}

Title: ${title}`;
    
}

async function submitForm() {
    var level, lang, title = getBasicData();
    
    // var lang = document.getElementById("language").value;
    // var level = document.getElementById("level").value;
    // var title = document.getElementById("title").value;

    var yamlStr = assembleRA(lang, level, title);
    var yamlBlob = getBlob(yamlStr);

    
    var statusMessage = document.getElementById("upload-status");
    try {
        var githubResponse = await uploadToGithub(title, yamlStr);
        console.log(githubResponse);
        var a = githubResponse.data.content.html_url;
        statusMessage.innerHTML = `Successfully created <a href="${a}" target="_blank">${a}</a>`;
        statusMessage.style.color = "green";
    } catch {
        statusMessage.innerHTML = `Error creating 'niveau${level}/${lang}/${title}'!`;
        statusMessage.style.color = "red";
    }  
}
