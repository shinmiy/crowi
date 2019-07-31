import Crowi from './Crowi'

import marked from 'marked'
import hljs from 'highlight.js'

import MarkdownFixer from './PreProcessor/MarkdownFixer'
import Linker from './PreProcessor/Linker'
import ImageExpander from './PreProcessor/ImageExpander'

import Emoji from './PostProcessor/Emoji'
import Mathjax from './PostProcessor/Mathjax'

import Tsv2Table from './LangProcessor/Tsv2Table'
import Template from './LangProcessor/Template'
import PlantUML from './LangProcessor/PlantUML'

interface PreProcessor {
  process: (markdown: string, dom: HTMLElement | undefined) => string
}

interface PostProcessor {
  process: (markdown: string, dom: HTMLElement | undefined) => string
}

interface LangProcessor {
  process: (code: string, lang: string) => string
}

export default class CrowiRenderer {
  crowi: Crowi

  preProcessors: PreProcessor[]

  postProcessors: PostProcessor[]

  langProcessors: { [key: string]: LangProcessor }

  constructor(crowi: Crowi) {
    this.crowi = crowi

    this.preProcessors = [new MarkdownFixer(), new Linker(), new ImageExpander()]
    this.postProcessors = [new Emoji(), new Mathjax(crowi)]

    this.langProcessors = {
      tsv: new Tsv2Table(crowi),
      'tsv-h': new Tsv2Table(crowi, { header: true }),
      template: new Template(crowi),
      plantuml: new PlantUML(crowi),
    }

    this.parseMarkdown = this.parseMarkdown.bind(this)
    this.codeRenderer = this.codeRenderer.bind(this)
    // this.headingRenderer = this.headingRenderer.bind(this)
  }

  preProcess(markdown: string, dom: HTMLElement | undefined = undefined) {
    for (let i = 0; i < this.preProcessors.length; i++) {
      if (!this.preProcessors[i].process) {
        continue
      }
      markdown = this.preProcessors[i].process(markdown, dom)
    }
    return markdown
  }

  postProcess(html: string, dom: HTMLElement | undefined = undefined) {
    for (let i = 0; i < this.postProcessors.length; i++) {
      if (!this.postProcessors[i].process) {
        continue
      }
      html = this.postProcessors[i].process(html, dom)
    }

    return html
  }

  codeRenderer(code: string, lang: string, escaped: boolean = false) {
    let result = ''
    let hl

    if (lang) {
      const langAndFn = lang.split(':')
      const langPattern = langAndFn[0]
      const langFn = langAndFn[1] || null
      if (this.langProcessors[langPattern]) {
        return this.langProcessors[langPattern].process(code, lang)
      }

      try {
        hl = hljs.highlight(langPattern, code)
        result = hl.value
        escaped = true
      } catch (e) {
        result = code
      }

      result = escape ? result : Crowi.escape(result, true)

      let citeTag = ''
      if (langFn) {
        citeTag = `<cite>${langFn}</cite>`
      }
      return `<pre class="wiki-code wiki-lang">${citeTag}<code class="lang-${lang}">${result}\n</code></pre>\n`
    }

    // no lang specified
    return `<pre class="wiki-code"><code>${Crowi.escape(code, true)}\n</code></pre>`
  }

  // headingRenderer(text, level) {
  //  var slug = text.toLowerCase().replace(/[^\w]+/g, '-');
  //  toc.push({
  //    level: level,
  //    slug: slug,
  //    title: text
  //  });
  //  return "<h" + level + " id=\"" + slug + "\"><a href=\"#" + slug + "\" class=\"anchor\"></a>" + text + "</h" + level + ">";
  // }

  parseMarkdown(markdown: string) {
    let parsed = ''

    const markedRenderer = new marked.Renderer()
    markedRenderer.code = this.codeRenderer
    // markedRenderer.heading = this.headingRenderer

    try {
      // TODO
      marked.setOptions({
        gfm: true,
        tables: true,
        breaks: true,
        pedantic: false,
        sanitize: false,
        smartLists: true,
        smartypants: false,
        renderer: markedRenderer,
      })

      // override
      // @ts-ignore
      marked.Lexer.lex = function(src: string, options: marked.MarkedOptions) {
        var lexer = new marked.Lexer(options)

        // this is maybe not an official way
        // @ts-ignore: Unofficial hack
        if (lexer.rules) {
          // @ts-ignore: Unofficial hack
          lexer.rules.fences = /^ *(`{3,}|~{3,})[ .]*([^\r\n]+)? *\n([\s\S]*?)\s*\1 *(?:\n+|$)/
        }

        return lexer.lex(src)
      }

      parsed = marked(markdown)
    } catch (e) {
      console.log(e, e.stack)
    }

    return parsed
  }

  render(markdown: string, dom: HTMLElement | undefined = undefined) {
    let html = ''

    markdown = this.preProcess(markdown, dom)
    html = this.parseMarkdown(markdown)
    html = this.postProcess(html, dom)

    return html
  }
}
