<div align="center">
  <p>
    <img 
    width="256"
    height="140"
    src="https://raw.githubusercontent.com/lichtquelle/generate-static-site/main/readme/generate-static-site-logo-512.png" 
    alt="logo" />
  </p>

  <p>Generate Static HTML Files from your Local Files or a Web Server.</p>

  <p align="center">  
  <a href="https://www.npmjs.com/package/generate-static-site"><img src="https://img.shields.io/npm/v/generate-static-site?style=flat-square" alt="NPM version"></a>
  <a href="https://github.com/lichtquelle/generate-static-site/actions?query=workflow%3ACI"><img src="https://img.shields.io/github/workflow/status/lichtquelle/generate-static-site/CI/main?label=build&logo=github&style=flat-square"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/built%20with-TypeScript-blue?style=flat-square"></a>
  <a href="https://github.com/yandeu/yandeu/blob/main/posts/2020-05-28-esm-for-nodejs.md"><img src="https://img.shields.io/badge/Node.js-ES%20Modules-F7DF1E?style=flat-square" alt="ES Modules Badge"></a>
</p>

</div>

<hr>

## Videos

Watch a simple introduction video on [YouTube](https://youtu.be/6kwvQHiWikY).

Watch an example using the [Wanilla](https://youtu.be/UbXaGvjI8l8) library.

## Usage

By default generate-static-site will pre-render all scripts\*. This means the scripts will be executed twice. Once in pre-render (SSR) and once on the client-side.

If you wish some scripts to only be pre-rendered or only be client-side rendered, see the examples below:

\*_except a block list of common files like, google-analytics, facebook.net, doubleclick.net, stats.wp.com etc._

```html
<!-- will be executed during SSR and client side -->
<script src="/js/script.js"></script>

<!-- will not be executed during SSR -->
<script noSSR src="/js/script.js"></script>

<!-- will only be executed during SSR (will be removed in the final site) -->
<script SSROnly src="/js/script.js"></script>

<!-- inline scripts with "noSSR" have no effect (include the script with src="" instead) -->
<script noSSR>
  // DON'T DO THIS!
</script>

<!-- will only be executed during SSR (will be removed in the final site) -->
<script SSROnly>
  // YOU CAN DO THIS
</script>

<!-- dynamically decide what to do -->
<script>
  if (window.isSRR) {
    // executed in SSR
  }

  if (!window.isSRR) {
    // executed on the client
  }
</script>
```

## Inline CSS

In order to inline a stylesheet, add the `inline` attribute:

```html
<link inline rel="stylesheet" href="/css/style.css" />
```

## Express Middleware

Coming soon.

## CLI

```
Generate Static Site

USAGE
  npx generate-static-site <input> <output> <entries...> [options]

ARGUMENTS
  input                   FOLDER or URL
  output                  FOLDER
  entries                 PATHS, separated by spaces

OPTIONS
  --allow=<regex...>      List of allowed resources as RegEx, separated by commas
  --block=<regex...>      List of blocked resources as RegEx, separated by commas
  --exec=<string>         Execute custom JavaScript
  --no-copy               Don't copy any resources
  --no-follow             Don't follow internal links
  --no-javascript         Disable JavaScript

GUI
  Run "npx generate-static-site" without arguments or options to display an easy to use step-by-step graphical interface
```

## CLI Examples

```bash
# renders all html files insider /src to /www
# (needs a index.html file inside /src)
npx generate-static-site

# optional use @latest (from time to time)
npx generate-static-site@latest

# renders "workspace files" to www
npx generate-static-site . www

# renders /site/one to www
npx generate-static-site site/one www

# renders https://my-website.com to www
npx generate-static-site https://my-website.com www

# renders http://localhost:8080 to www
# (starts rendering with the /contact page)
npx generate-static-site http://localhost:8080 www contact

# allows to only fetch .js files during ssr
[...] --allow=/\.js$/

# prevent only google analytics from being executed during rendering
[...] --block=/google-analytics\.com/

# execute custom JavaScript (remove title)
[...] --exec="const title = document.getElementById('title');if (title) title.remove();"

# execute custom JavaScript (change background color)
[...] --exec="const wrapper = document.getElementById('wrapper');if (wrapper) wrapper.style.backgroundColor = 'blue';"
```

---

_Better documentation available soon as part of the [Licht](https://licht.dev) project._
