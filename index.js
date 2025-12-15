/////////////////////////////////////////////////////////
//// HELPERS
/////////////////////////////////////////////////////////


function getGitHubPat() {

    var token = document.getElementById("gh-pat").value;

    if (token == null || token == "") {
        alert("Please put a GitHub Personal-Access token in the field at the top first!");
        throw "No Github PAT!"
    }
    return token;
}


/////////////////////////////////////////////////////////
//// BASIC FUNCTIONS
/////////////////////////////////////////////////////////

async function loadPage() {
    let token = prompt("Please enter the GitHub Personal-Access Token (classic):", "");
    if (!(token == null || token == "")) {
        document.getElementById("gh-pat").value = token;
    } 
    getTitles();
}


/////////////////////////////////////////////////////////
//// FETCHING DATA
/////////////////////////////////////////////////////////

async function listRAs(level, language){

    var octokitModule = await import("https://esm.sh/@octokit/core");

    var octokit = new octokitModule.Octokit({auth: getGitHubPat()})

    var langEN = (language == 'English') ? 'English' : 'Dutch'; 
    var path = `published/niveau${level}/${langEN}/`
    var folderContents = await octokit.request('GET /repos/valevo/form-auto-commit-test/contents/'+path, {
  owner: 'OWNER',
  repo: 'form-auto-commit-test',
  path: path,
  headers: {
    'X-GitHub-Api-Version': '2022-11-28'
  }
});
    console.log(folderContents);
    return folderContents;
}


async function getTitles() {
    var lang = document.getElementById("language").value;
    var level = document.getElementById("level").value;
    // var title = document.getElementById("title").value;

    var result = await listRAs(level, lang);

    if (result) {
        var options = document.getElementById('matching-RAs');
        options.innerHTML = '';
        for (const file of result.data) {
            console.log(file.name);
            // if (file.name.includes(title)) {
            var option = document.createElement('option');
            option.value = file.name;
            options.appendChild(option);
        }
    }
}


async function getRAData() {
    
}

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
};


async function uploadToGithub(text) {

    var octokitModule = await import("https://esm.sh/@octokit/core");
    // this is the "form-auto-commit_token" PAT (classic)
    var octokit = new octokitModule.Octokit({auth: getGitHubPat()});
    var response = await octokit.request('PUT /repos/valevo/form-auto-commit-test/contents/test4.yaml', {
                              owner: 'valevo',
                              repo: 'form-auto-commit-test',
                              path: 'test4.yaml',
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
    var lang = document.getElementById("language").value;
    var langEN = (language == 'English') ? 'English' : 'Dutch'; 

    var level = document.getElementById("level").value;
    var title = document.getElementById("title").value;


    var yamlStr = assembleRA(lang, level, title);

    var yamlBlob = getBlob(yamlStr);
        
    // const yamlObject = {
    //     Language: lang,
    //     Level: level,
    //     Title: title
    // };
    // const yamlString = yaml.dump(jsObject);
    // console.log(yamlString);
    var statusMessage = document.getElementById("upload-status");
    try {
        var githubResponse = await uploadToGithub(yamlStr);
        console.log(githubResponse);
        var a = githubResponse.data.content.html_url;
        statusMessage.innerHTML = `Successfully created <a href="${a}">${a}</a>`;
        statusMessage.style.color = "green";
    } catch {
        statusMessage.innerHTML = `Error creating 'niveau${level}/${langEN}/${title}'!`;
        statusMessage.style.color = "red";
    }
    
}
