# LyFil

Lyrics Filler with Tonal Concerns (especially tonal languages).  In TypeScript.

## Architecture (Draft?)

### Source
```
Source Lyrics (String)
 `- Verses (Separated by $ (Or by 2 newlines))
     `- Sentences (Separated by space, comma (,) or by newlines)
         `- Phrases (Separated by /)
```

Example
```
今天我/寒夜裡看雪飄過  <- This is a whole sentence, while music breaks at /
懷著冷卻了的心窩漂遠方
風雨裏追趕
霧裡分不清影蹤
天空海闊你與我/可會變  <- This is a whole sentence, while the melody pauses at /
（誰沒在變）
...
```

Which is parsed into a string in the form `___/_______,_____,_____,_____,_____/____$...`
### Constraints

```
Can use - for AND, | for OR phrases.

No prefix <- Dictionary with pure vocabs
: <- dictionary alias, that decomposes into aliases or no prefix
^ <- Sentence splitter
$ <- Verses splitter
# <- Song

Not needed at the moment:
, <- Phrase splitter
/ <- Tempo splitter (there should be a break between vocabs, but this doesn't break the phrase (like between 如果 & 可以))
```

Say, a song can be filled by the **Story** : "Start THEN Development THEN Twist THEN End".

Which, only Development can consume more than 1 verse.

So the corresponding constraint (conceptually, not syntactically) would be: `#Story = $Start-#Development-$Twist-$End`.

Which `#Development` should be decomposed as `$Development|$Development-#Development` (1 or more than 1 `$Development`).

Let's dig deeper with `$Start`.  Assume it is `Name THEN Background`, which only Background can span across sentences.

Thus `$Start = ^Name-$Background`, which `$Background = ^Background|^Background-$Background`.

Then for sentence `^Background`, it consists of several phrases (to be separated by commas).  Let's just call them `^phrases` (as if we are treating an incomplete sentence as sentence itself), which are in the form of `:subject-:verb-:object` which connects directly to dictionary `subject`, etc..



