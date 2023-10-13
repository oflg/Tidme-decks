#!/usr/bin/env node

/*
Make a plugin library containing all of the book plugins

node ./bin/make-book-library.js <path-to-directory-of-book-json-files> <path-to-output-folder>
*/

const fs = require("fs"),
    path = require("path");
const { formatWithOptions } = require("util");

// Check arguments

const bookPath = process.argv[2] || "./docs/book",
    outputPath = process.argv[3] || "./docs/plugin";

if (!bookPath) {
    throw "Missing book directory path";
}

if (!outputPath) {
    throw "Missing output path";
}

function mkdir(dirpath, dirname) {
    if (typeof dirname === "undefined") {
        if (fs.existsSync(dirpath)) {
            return;
        } else {
            mkdir(dirpath, path.dirname(dirpath));
        }
    } else {
        if (dirname !== path.dirname(dirpath)) {
            mkdir(dirpath);
            return;
        }
        if (fs.existsSync(dirname)) {
            fs.mkdirSync(dirpath);
        } else {
            mkdir(dirname, path.dirname(dirname));
            fs.mkdirSync(dirpath);
        }
    }
}

// Get the pathnames of all of the book plugins

const booksFilepaths = fs
    .readdirSync(bookPath)
    .map((filename) => path.resolve(bookPath, filename))
    .filter((filepath) => !fs.statSync(filepath).isDirectory() && filepath.endsWith(".txt"));

const booksInfoFilepaths = fs
    .readdirSync(bookPath)
    .map((filename) => path.resolve(bookPath, filename))
    .filter((filepath) => !fs.statSync(filepath).isDirectory() && filepath.endsWith(".json"));

const bookListsData = fs.readFileSync(booksInfoFilepaths[0], "utf8");

const bookListsJson = JSON.parse(bookListsData);

const bookInfoArry = bookListsJson.data.normalBooksInfo;

// console.log(bookInfoArry);

for (const filepath of booksFilepaths) {

    let version = "1.0.5";

    let bookName = filepath.split("/").slice(-1)[0].replace(".txt", "");

    let bookInfo = bookInfoArry.find((bi) => bi.id === bookName);

    // bookName=bookInfo.title;

    let tiddlers = {};

    let plugintitle = `$:/plugins/tidme/decks-${bookName}`;
    let readme = `${plugintitle}/readme`;
    let deck = `$:/Deck/${bookName}`;
    let tabbuttonTemplate = `$:/plugins/tidme/decks/${bookName}/tab/buttonTemplate`;
    let tabtemplate = `$:/plugins/tidme/decks/${bookName}/tab/template`;
    let front = `$:/plugins/tidme/decks/${bookName}/front`;
    let back = `$:/plugins/tidme/decks/${bookName}/back`;
    let style = `$:/plugins/tidme/decks/${bookName}/style.css`;
    let config = "$:/config/EditTemplateFields/Visibility/word_json"

    tiddlers[config] = {
        title: config,
        text: "hide"
    };

    tiddlers[readme] = {
        title: readme,
        text: `[img height=150 [${bookInfo.cover}]]

此学习包共有 ${bookInfo.wordNum}个来源于${bookInfo.bookOrigin.originName}的单词。${bookInfo.introduce}

可在 [[墨屉手册|https://oflg.github.io/Tidme/manual/zh-Hans#共享牌组插件]] 查看安装使用教程。`,
    };

    tiddlers[deck] = {
        title: deck,
        tags: `$:/tags/TidmeDeck`,
        card: `[all[shadows+tiddlers]prefix[$:/${bookName}/]]`,
        caption: bookInfo.title,
        description: `<center>[img height=150 [${bookInfo.cover}]]</center><center>此学习包共有${bookInfo.wordNum}个来源于${bookInfo.bookOrigin.originName}的单词。${bookInfo.introduce}</center>`,
        card_unfold: `[tag[.]]`,
        card_exclude: `[tag[!]]`,
        order: `due-new`,
        order_learn: `[sort[due]]`,
        order_new: `[sortan[title]]`,
        order_due: `[sort[due]]`,
        leech_threshold: `8`,
        leech_action: `<$action-sendmessage $message="tm-add-tag" $param="!"/>`,
        state_learn: `[state[1]] [state[3]] :filter[{!!due}compare:date:lt<now [UTC]YYYY0MM0DD0hh0mm0ss0XXX>]`,
        state_due: `[state[2]has[due]] -[!days:due[1]]`,
        state_new: `[!has[state]] [state[0]]`,
        p: `{ "request_retention":0.9, "maximum_interval":36500, "w":[0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61] }`
    };

    tiddlers[tabbuttonTemplate] = {
        title: tabbuttonTemplate,
        "code-body": "yes",
        text: `<$text text={{{ [<word_content>jsonget<currentTab>,[desc]else<currentTab>] }}}/>`,
    };

    tiddlers[tabtemplate] = {
        title: tabtemplate,
        "code-body": "yes",
        text: `<$let
    tab_content={{{ [<word_content>jsonextract<currentTab>] }}}
>
    <$list
        filter="[<currentTab>match[sentence]]"
    >
        <$let
            contents={{{ [<tab_content>jsonextract[sentences]] }}}
        >
            <$list
                filter="[<contents>jsonindexes[]]"
                variable="index"
            >
                <$let
                    content={{{ [<contents>jsonextract<index>] }}}
                >
                    <$text
                        text={{{ [<content>jsonget[sContent]] }}}
                    />
                    <br/>
                    <sup>
                        <$text
                            text={{{ [<content>jsonget[sCn]] }}}
                        />
                    </sup>
                    <br/>
                </$let>
            </$list>
        </$let>
    </$list>
    <$list
        filter="[<currentTab>match[syno]]"
    >
        <$let
            contents={{{ [<tab_content>jsonextract[synos]] }}}
        >
            <$list
                filter="[<contents>jsonindexes[]]"
                variable="index"
            >
                <$let
                    content={{{ [<contents>jsonextract<index>] }}}
                >
                    <$text
                        text={{{ [<content>jsonindexes[hwds]] :map:flat[<content>jsonget[hwds],<currentTiddler>,[w]] +[join[; ]] }}}
                    />
                    <br/>
                    <sup>
                        <$text
                            text={{{ [<content>jsonget[pos]] }}}
                        />. <$text
                            text={{{ [<content>jsonget[tran]] }}}
                        />
                    </sup>
                    <br/>
                </$let>
            </$list>
        </$let>
    </$list>
    <$list
        filter="[<currentTab>match[phrase]]"
    >
        <$let
            contents={{{ [<tab_content>jsonextract[phrases]] }}}
        >
            <$list
                filter="[<contents>jsonindexes[]]"
                variable="index"
            >
                <$let
                    content={{{ [<contents>jsonextract<index>] }}}
                >
                    <$text
                        text={{{ [<content>jsonget[pContent]] }}}
                    />
                    <br/>
                    <sup>
                        <$text
                            text={{{ [<content>jsonget[pCn]] }}}
                        />
                    </sup>
                    <br/>
                </$let>
            </$list>
        </$let>
    </$list>
    <$list
        filter="[<currentTab>match[relWord]]"
    >
        <$let
            contents={{{ [<tab_content>jsonextract[rels]] }}}
        >
            <$list
                filter="[<contents>jsonindexes[]]"
                variable="index"
            >
                <$let
                    content={{{ [<contents>jsonextract<index>] }}}
                >
                    ''<$text
                        text={{{ [<content>jsonget[pos]] }}}
                    />.''<br/>
                    <$list
                        filter="[<content>jsonindexes[words]]"
                        variable="wordindex"
                    >
                        <$text
                            text={{{ [<content>jsonget[words],<wordindex>,[hwd]] }}}
                        />: <$text
                                text={{{ [<content>jsonget[words],<wordindex>,[tran]] }}}
                        />
                        <br/>
                    </$list>
                </$let>
            </$list>
        </$let>
    </$list>
    <$list
        filter="[<currentTab>match[realExamSentence]]"
    >
        <$let
            contents={{{ [<tab_content>jsonextract[sentences]] }}}
        >
            <$list
                filter="[<contents>jsonindexes[]]"
                variable="index"
            >
                <$let
                    content={{{ [<contents>jsonextract<index>] }}}
                >
                    <$text
                        text={{{ [<content>jsonget[sContent]] }}}
                    />
                    <br/>
                    <sup>
                        <$text
                            text={{{ [<content>jsonindexes[sourceInfo]sortby[level year paper type]] :map:flat[<content>jsonget[sourceInfo],<currentTiddler>] +[join[ ]] }}}
                        />
                    </sup>
                    <br/>
                </$let>
            </$list>
        </$let>
    </$list>
</$let>`,
    };

    tiddlers[front] = {
        title: front,
        "code-body": "yes",
        text: `
<$let
    word_content={{{ [{!!word_json}jsonextract[content],[word],[content]] }}}
>
    <div
        class="${bookName}"
    >
        <h1>{{!!word}}</h1>
        <$list
            filter="[<word_content>jsonget[picture]!is[blank]]"
            variable="picture"
        >
            <br><img src=<<picture>> style="height:100px;">
        </$list>
    </div>
</$let>`,
    };

    tiddlers[back] = {
        title: back,
        "code-body": "yes",
        text: `
<$let
    word_content={{{ [{!!word_json}jsonextract[content],[word],[content]] }}}
>
    <div
        class="${bookName}"
    >
        <div
            class="audio"
        >
            <span>英 <$text text={{{ [<word_content>jsonget[usphone]] }}}/></span>
            <span><audio controls autoplay muted><source src={{{ [[https://dict.youdao.com/dictvoice?type=1&audio=]addsuffix{!!word}] }}} type="audio/mpeg"/>
            </audio></span>
        </div>
        <h3>
            <$text
                text={{{ [<word_content>jsonget[trans],[0],[pos]] }}}/>. <$text text={{{ [<word_content>jsonget[trans],[0],[tranCn]] }}}
            />
        </h3>
        <div>
            <$text
                text={{{ [<word_content>jsonget[trans],[0],[tranOther]] }}}
            />
        </div>
        <$list
            filter="[<word_content>jsonget[remMethod],[val]!is[blank]]"
            variable="val"
        >
            <div
                class="tip"
            >
                <h4>
                    {{$:/core/images/tip}} <<val>>
                </h4>
            </div>
        </$list>
        <$macrocall
            $name="tabs"
            tabsList="[<word_content>jsonindexes[]] -trans -phone -usphone -speech -usspeech -ukphone -ukspeech -picture -star -remMethod -exam"
            default="remMethod"
            state="$:/temp/tidme/state"
            template="${tabtemplate}"
            buttonTemplate="${tabbuttonTemplate}"
        />
    </div>
</$let>`,
    };

    tiddlers[style] = {
        title: style,
        tags: "$:/tags/Stylesheet",
        text: `
.${bookName} .audio {
    display:flex;
    justify-content:space-between;
    align-items:center;
}

.${bookName} .audio audio{
    width:120px;
    height:18px;
}

.${bookName} .tip svg {
    vertical-align:middle;
}`,
    };

    let linesData = fs.readFileSync(filepath, "UTF-8");

    let lines = linesData.split(/\r?\n/);

    for (let li = 0; li < lines.length - 1; li++) {
        let line = lines[li];

        let wordJSON = JSON.parse(line);

        // let wordObject = JSON.parse(line).content.word;

        let word = wordJSON.headWord,
            title = "$:/" + bookName + "/" + wordJSON.wordRank + "/" + wordJSON.headWord;

        tiddlers[title] = {
            title: title,
            word: word,
            word_json: line,
            caption: `{{||${front}}}`,
            text: `{{||${back}}}`
        };
    }

    let text = JSON.stringify({ tiddlers });

    let plugin = {
        author: "oflg",
        "core-version": ">=5.3.0",
        description: bookInfo.title,
        list: "readme",
        name: "Tidme Decks",
        "plugin-type": "plugin",
        source: "https://github.com/oflg/Tidme",
        title: plugintitle,
        version: version,
        type: "application/json",
        text: text,
    };

    let pluginName = `${bookName}.json`;

    mkdir(outputPath);

    fs.writeFileSync(path.resolve(outputPath, pluginName), JSON.stringify(plugin));

    console.log(bookName);
}
