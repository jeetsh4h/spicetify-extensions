//@ts-check

// NAME: Wikify
// AUTHOR: CharlieS1103
// DESCRIPTION: View an artists wikipedia page to learn more about them

/// <reference path="../../spicetify-cli/globals.d.ts" />
(function WikiFy() {
    if (!document.body.classList.contains('wikify-injected')) {
        var styleSheet = document.createElement("style")

        styleSheet.innerHTML =
            `body > generic-modal > div > div {
        background-color: beige !important;
        color: black !important;
    }  `
        document.body.appendChild(styleSheet)
        document.body.classList.add('wikify-injected');
    }
    const {
        CosmosAsync,
        URI
    } = Spicetify;
    if (!(CosmosAsync && URI)) {
        setTimeout(WikiFy, 10);
        return;
    }
    // @ts-ignore
    const lang = Spicetify.Locale.getLocale();
    const buttontxt = "View Wiki"
    //Watch for when the song is changed

    function error() {
        Spicetify.PopupModal.display({
            title: "Error",
            content: "Selected artist does not have a WikiPedia page, Sorry."
        });
    }

    async function getWikiText(uris) {

        const rawUri = uris[0];
        const uriSplit = rawUri.split(":");
        const uriType = uriSplit[1];
        const uri = uriSplit[2];
        let artistName = undefined;
        
        //This assumes that the `View Wiki` option is only available for artists and tracks
        if (uriType === "artist") {
            const artistObject = await CosmosAsync.get(`https://api.spotify.com/v1/artists/${uri}`);
            artistName = artistObject.name;
        } else if (uriType === "track") {
            const trackObject = await CosmosAsync.get(`https://api.spotify.com/v1/tracks/${uri}`);
            artistName = trackObject.artists[0].name;
        }

        const artistNameTrimmed = (artistName).replace(/\s/g, "%20");

        //TODO: search up individual songs too, not just the artist of the song
        if (artistName != null) {
            try {
                const wikiInfo = await CosmosAsync.get(`https://${lang}.wikipedia.org/w/api.php?action=query&format=json&prop=extracts%7Cdescription&titles=${artistNameTrimmed}`)
                //TODO: option to choose local language or english / english fallback? / subcontextmenu to choose?
                //https://en.wikipedia.org/w/api.php?action=query&format=json&uselang=en&list=search&srsearch=${artistNameTrimmed}

                const wikiInfoArr = wikiInfo.query.pages
                const page = Object.values(wikiInfoArr)[0];
                if (page != null || page != undefined) {
                    const pageText = page.extract.replace(/<!--[\s\S]*?-->/g, '');
                    if (pageText != "\n") {
                        Spicetify.PopupModal.display({
                            title: "WikiFy",
                            content: page.extract
                        });
                    } else {
                        error();
                    }
                } else {
                    error();
                }
            } catch {
                Spicetify.PopupModal.display({
                    title: "Error",
                    content: "Request failed",
                })
            }
        }
    }

    function shouldDisplayContextMenu(uris) {
        if (uris.length > 1) {
            return false;
        }
        const uri = uris[0];
        const uriObj = Spicetify.URI.fromString(uri);
        if (uriObj.type === Spicetify.URI.Type.TRACK || uriObj.type === Spicetify.URI.Type.ARTIST) {
            return true;
        }
        return false;
    }

    const cntxMenu = new Spicetify.ContextMenu.Item(
        buttontxt,
        getWikiText,
        shouldDisplayContextMenu,
    );

    cntxMenu.register();

})();
