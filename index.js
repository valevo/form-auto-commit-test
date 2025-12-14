var textFile = null,
  makeTextFile = function (text) {
    var data = new Blob([text], {type: 'text/plain'});

    // If we are replacing a previously generated file we need to
    // manually revoke the object URL to avoid memory leaks.
    if (textFile !== null) {
      window.URL.revokeObjectURL(textFile);
    }

    textFile = window.URL.createObjectURL(data);

    // returns a URL you can use as a href
    return textFile;
  };



async function uploadToGithub(auth_token, text) {

    var octokitModule = await import("https://esm.sh/@octokit/core");
    // this is the "form-auto-commit_token" PAT (classic)
    var octokit = new octokitModule.Octokit({auth: auth_token});
    var response = await octokit.request('PUT /repos/valevo/form-auto-commit-test/contents/test5.yaml', {
                              owner: 'valevo',
                              repo: 'form-auto-commit-test',
                              path: 'test5.yaml',
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

    var yamlBlob = makeTextFile(yamlStr);
        
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


// var create = document.getElementById('create'),
//     textbox = document.getElementById('textbox');

//   create.addEventListener('click', function () {
//     var link = document.createElement('a');
//     link.setAttribute('download', 'info.txt');
//     link.href = makeTextFile(textbox.value);
//     document.body.appendChild(link);

//     // wait for the link to be added to the document
//     window.requestAnimationFrame(function () {
//       var event = new MouseEvent('click');
//       link.dispatchEvent(event);
//       document.body.removeChild(link);
//     });

//   }, false);