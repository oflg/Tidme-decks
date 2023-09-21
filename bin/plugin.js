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
    let bookName = filepath.split("/").slice(-1)[0].replace(".txt", "");

    let bookInfo = bookInfoArry.find((bi) => bi.id === bookName);

    // bookName=bookInfo.title;

    let tiddlers = {};

    let plugintitle = `$:/plugins/tidme/decks/${bookName}`;
    let readme = `${plugintitle}/readme`;
    let deck = `$:/Deck/${bookName}`;
    let template = `$:/${bookName}/Template`;

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
        state_learn: `[state[1]] [state[3]] :filter[{!!due}compare:date:lt<now[UTC]YYYY0MM0DD0hh0mm0ss0XXX>]`,
        state_due: `[state[2]has[due]] -[!days:due[1]]`,
        state_new: `[!has[state]] [state[0]]`,
        p: `{ "request_retention":0.9, "maximum_interval":36500, "w":[0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61] }`
    };

    tiddlers[template] = {
        title: template,
        "code-body": "yes",
        text: `<style>
    .wordtip svg {
        width:1em; height:1em; vertical-align:middle;
    }
</style>
<h1>{{!!word}}</h1><$reveal
    default={{!!picture}}
    type="nomatch"
    text=""
    animate="yes"
>
<br><img src={{!!picture}}style="height:100px;">
</$reveal>
<$reveal
    state=<<folded-state>>
    type="nomatch"
    text="hide"
    animate="yes"
>
    <div
        class="tc-tiddler-body"
   >

        <div
            style="display:flex;justify-content:space-between;align-items:center;"
       >
        <span>^^英 {{!!ukphone}}^^</span>
        <span>^^<audio controls autoplay muted  style="width:120px;height:18px;">
                            <source
                                src={{{ [[https://dict.youdao.com/dictvoice?audio=]addsuffix{!!word}] }}}
                                type="audio/mpeg"
                           >
                        </audio>^^</span>
        </div>

        {{!!transCn}}

        <$reveal
            default={{!!remMethod}}
            type="nomatch"
            text=""
            animate="yes"
            class="wordtip"
       >

            {{$:/core/images/tip}}{{!!remMethod}}
        </$reveal>
        <$reveal
            default={{!!realExamSentences}}
            type="nomatch"
            text=""
            animate="yes"
       >
            <details>
                <summary>真题</summary>
                <p>{{!!realExamSentences}}</p>
            </details>
        </$reveal>
        <$reveal
            default={{!!relWords}}
            type="nomatch"
            text=""
            animate="yes"
       >
            <details>
                <summary>同根</summary>
                <p>{{!!relWords}}</p>
            </details>
        </$reveal>
        <$reveal
            default={{!!synos}}
            type="nomatch"
            text=""
            animate="yes"
       >
            <details>
                <summary>同近</summary>
                <p>{{!!synos}}</p>
            </details>
        </$reveal>
        <$reveal
            default={{!!phrases}}
            type="nomatch"
            text=""
            animate="yes"
       >
            <details>
                <summary>短语</summary>
                <p>{{!!phrases}}</p>
            </details>
        </$reveal>
        <$reveal
            default={{!!sentences}}
            type="nomatch"
            text=""
            animate="yes"
       >
            <details>
            <summary>例句</summary>
            <p>{{!!sentences}}</p>
            </details>
        </$reveal>
    </div>
</$reveal>`,
    };

    let linesData = fs.readFileSync(filepath, "UTF-8");

    let lines = linesData.split(/\r?\n/);

    for (let li = 0; li < lines.length - 1; li++) {
        let line = lines[li];

        let wordObject = JSON.parse(line).content.word;

        let word = wordObject.wordHead,
            title = "$:/" + bookName + "/" + wordObject.wordId.split("_").slice(-1)[0] + "/" + word;

        let content = wordObject.content;

        let transCn = "";

        for (let ti = 0; ti < content.trans.length; ti++) {
            let tran = content.trans[ti];

            if (tran.pos) {
                transCn += "<b>" + tran.pos + ".</b> ";
            }

            transCn += tran.tranCn + "<br>";
        }

        tiddlers[title] = {
            title: title,
            word: word,
            transCn: transCn,
            caption: `{{||${template}}}`,
        };

        if ("ukphone" in content) {
            let ukphone = content.ukphone;
            tiddlers[title]["ukphone"] = ukphone;
        }

        if ("usphone" in content) {
            let usphone = content.usphone;
            tiddlers[title]["usphone"] = usphone;
        }

        if ("remMethod" in content) {
            let remMethod = content.remMethod.val;
            tiddlers[title]["remMethod"] = remMethod;
        }

        if ("picture" in content) {
            let picture = content.picture;
            tiddlers[title]["picture"] = picture;
        }

        if ("phrase" in content) {
            let phrases = "";

            for (let pi = 0; pi < content.phrase.phrases.length; pi++) {
                let phrase = content.phrase.phrases[pi];

                phrases += phrase.pContent + ":" + phrase.pCn + "<br>";
            }

            tiddlers[title]["phrases"] = phrases;
        }

        if ("sentence" in content) {
            let sentences = "";

            for (let si = 0; si < content.sentence.sentences.length; si++) {
                let sentence = content.sentence.sentences[si];

                sentences += sentence.sContent + "<br>^^" + sentence.sCn + "^^<br>";
            }
            tiddlers[title]["sentences"] = sentences;
        }

        if ("relWord" in content) {
            let relWords = "";

            for (let ri = 0; ri < content.relWord.rels.length; ri++) {
                let relword = content.relWord.rels[ri];

                let words = "";

                if (relword.pos) {
                    words += "<b>" + relword.pos + ".</b><br>";
                }

                for (let wj = 0; wj < relword.words.length; wj++) {
                    let w = relword.words[wj];

                    words += w.hwd + ":" + w.tran + "<br>";
                }

                relWords += words + "<br>";
            }
            tiddlers[title]["relWords"] = relWords;
        }

        if ("syno" in content) {
            let synos = "";

            for (let syi = 0; syi < content.syno.synos.length; syi++) {
                let syno = content.syno.synos[syi];

                let hwds = [];

                for (let hj = 0; hj < syno.hwds.length; hj++) {
                    let hw = syno.hwds[hj];
                    hwds.push(hw.w);
                }

                let hwdsstr = hwds.join(", ");

                if (syno.pos) {
                    syno.tran = "<b>" + syno.pos + ".</b><br>" + syno.tran;
                }

                synos += syno.tran + "：" + hwdsstr + "<br>";
            }
            tiddlers[title]["synos"] = synos;
        }

        if ("realExamSentence" in content) {
            let realExamSentences = "";

            for (let rei = 0; rei < content.realExamSentence.sentences.length; rei++) {
                let realexamsentence = content.realExamSentence.sentences[rei];

                realExamSentences +=
                    realexamsentence.sContent +
                    "<br>^^" +
                    realexamsentence.sourceInfo.year +
                    " " +
                    realexamsentence.sourceInfo.level +
                    " " +
                    realexamsentence.sourceInfo.paper +
                    " " +
                    realexamsentence.sourceInfo.type +
                    "^^<br>";
            }
            tiddlers[title]["realExamSentences"] = realExamSentences;
        }
    }

    let text = JSON.stringify({ tiddlers });

    let plugin = {
        author: "oflg",
        "core-version": ">=5.3.0",
        description: "牌组",
        list: "readme",
        name: bookInfo.title,
        "plugin-type": "plugin",
        source: "https://github.com/oflg/Tidme",
        title: plugintitle,
        version: "1.0.0",
        type: "application/json",
        text: text,
    };

    let pluginName = `${bookName}.json`;

    mkdir(outputPath);

    fs.writeFileSync(path.resolve(outputPath, pluginName), JSON.stringify(plugin));

    console.log(bookName);
}