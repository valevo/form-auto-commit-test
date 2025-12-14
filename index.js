function getBlob (text) {
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



async function uploadToGithub(auth_token, text) {

    var octokitModule = await import("https://esm.sh/@octokit/core");
    // this is the "form-auto-commit_token" PAT (classic)
    var octokit = new octokitModule.Octokit({auth: auth_token});
    var response = await octokit.request('PUT /repos/valevo/form-auto-commit-test/contents/test1.yaml', {
                              owner: 'valevo',
                              repo: 'form-auto-commit-test',
                              path: 'test1.yaml',
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



async function listRAs(level, language, text=''){

    var octokitModule = await import("https://esm.sh/@octokit/core");

    var octokit = new octokitModule.Octokit({auth: token})

    var folderContents = await octokit.request('GET /repos//valevo/form-auto-commit-test/contents/{path}', {
  owner: 'OWNER',
  repo: 'REPO',
  path: 'PATH',
  headers: {
    'X-GitHub-Api-Version': '2022-11-28'
  }
})



/////////////////////////////////////////////////////////


function assembleRA(lang, level, title) {
    return `Language: ${lang}

Level: ${level}

Title: ${title}`;
    
}

async function submitForm() {
    var lang = document.getElementById("language").value;
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
    
    // alert(assembleRA(lang, level, title));

    // alert(yamlBlob);
    let token = prompt("Please enter the GitHub Personal-Access Token (classic):", "");
    if (token == null || token == "") {
        return yamlBlob;
    } else {
        var githubResponse = await uploadToGithub(token, yamlStr);
        console.log(githubResponse);
    }
}
