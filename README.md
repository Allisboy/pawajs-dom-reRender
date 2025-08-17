# pawajs-dom-reRender
for pawajs dom diffing with server html (pawa-ssr)

```javascript
import {pawaRender} from 'pawajs-dom-reRender'

try {
    //fetch url
    // Fetches the HTML content from the specified URL.
    const href = await fetch('/the url to fetch')
    href.text().then(res =>{
        //parse html
                // Creates a new DOMParser to parse the fetched HTML string.
                const parser = new DOMParser()
                //fetch html from server
        // Parses the fetched HTML string into a Document object.
        const app = parser.parseFromString(res, 'text/html')
            //fetch mainScript
        // Selects the script element marked with 'page-script' from the fetched HTML.
        const mainScript=app.body.querySelector('[page-script]')
        // Selects the new application root element from the fetched HTML based on the current app's ID.
        const newApp=app.body.querySelector('#'+pageApp.getAttribute('id'))
        // Updates the document title with the title from the fetched HTML.
        document.title=app.title
        // Gets the 'page-url' attribute from the current application's page URL element.
        const pageUrl=pageApp.querySelector('[page-url]').getAttribute('page-url')
        // Gets the 'page-url' attribute from the new application's page URL element.
        const newAppUrl= newApp.querySelector('[page-url]').getAttribute('page-url')
        // Creates a clone of the new application element.
        const clone=newApp.cloneNode(true)
        console.log(pageApp,newApp);
        
            // Checks if the page URL has changed.
            if (pageUrl !== newAppUrl) {
                
                // If a main script is present in the new HTML.
                if (mainScript) {
                    
                    // Selects the current script element marked with 'page-script' in the document body.
                    const currentScript=document.body.querySelector('[page-script]')
                    // Creates a comment node to temporarily replace the script.
                    const comment =document.createComment('script')
                    // Creates a new script element.
                    const newScript=document.createElement('script')
                     newScript.setAttribute('src',mainScript.getAttribute('data-client-src'))
                    
                    // Sets an onload event handler for the new script.
                    newScript.onload = () => {
                        
                      pawaRender(pageApp,newApp)
                     // console.log(appRecorder)
                    };
                    // If a current script exists, replace it with the new script.
                    if (currentScript) {
                         currentScript.replaceWith(comment);
                    comment.parentElement.insertBefore(newScript, comment);
                    comment.remove();
                    }else{
                        pageApp.parentElement.insertBefore(newScript,pageApp)
                    }
                // If no main script is present, just re-render the page.
                } else {
                    pawaRender(pageApp,newApp)
                }
            // If the page URL has not changed, just re-render the page.
            }else{
                pawaRender(pageApp,newApp)
            }
            })
} catch (error) {
    console.log(error);

}
```

#⚠️ pawajs-dom-reRender is a diff engine and not a v-dom engine
* more update coming soon....
* currently pawajs-dom-reRender isn't capable to reArrange the element perfectly now so server loop filtering won't work perfectly but its capable to do it so we currently working on it.
# MIT LICENSE