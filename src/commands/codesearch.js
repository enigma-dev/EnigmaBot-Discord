// Copyright (C) 2018 Josh Ventura
// This code is distributed under the GNU General Public License, Version 3.
// You may use, modify, and distribute it per the terms of that license.

const fs = require('fs');
const find = require('find');
const path = require('path');
const backslashes = require('utility/backslashes.js');

// Shit that should be standard but isn't:
function open(file) {
  return fs.readFileSync(file).toString().split("\n");
}
RegExp.escape= function(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};
// End shit that should be standard but isn't

const blacklist = [
  /^\.git/,
  /\.png$/,
  /\.jpg$/,
  /\.zip$/,
  /\.bmp$/,
];

search_results = null
results_by_relevance = null
current_result = null
displayed_result = null

class SearchResult{
  constructor(repo, path, filename, lineno, line) {
    this.repo = repo
    this.path = path
    this.filename = filename
    this.lineno = lineno
    this.line = line
  }
  str() {
    if (!this.lineno || !this.line)
      return `\`//${this.path}\``
    return `\`//${this.path}:${this.lineno}\`:  \`${this.line}\``;
  }
}

class ResultFile{
  constructor(path, filename, count) {
    this.path = path
    this.filename = filename
    this.count = count
  }
}

class SearchManager {
  constructor (repo) {
    this.repo = repo
    this.rootdir = `/repos/${repo}/`
  }

  performSearch(line) {
    for (const pred of this.search_predicates) {
      if (pred(line)) return true;
    }
    return false;
  }

  searchFile(fullpath, abbrpath, filename) {
    for (const pred of this.file_predicates) {
      if (!pred(fullpath)) return [];
    }
    
    if (!this.search_predicates.length)
      return [new SearchResult(this.repo, abbrpath, filename, null, null)];
    
    let lineno = 1;
    const results = [];
    for (const line of open(fullpath)) {
      if (this.performSearch(line)) {
        results.push(new SearchResult(this.repo,
                                      abbrpath, filename, lineno, line));
      }
      ++lineno;
    }
    return results;
  }

  populateSearch() {
    const mgr = this;
    const repo_files = find.fileSync(this.rootdir);
    
    const results = [];
    for (const file_obj of repo_files) {
      const fullpath = file_obj;
      const subdir = path.dirname(fullpath);
      const file = path.basename(fullpath);
      const abbrpath = fullpath.replace(mgr.rootdir, '')
      
      let consider = true;
      for (const item of blacklist) {
        if (abbrpath.match(item)) {
          consider = false;
          break;
        }
      }
      if (!consider) continue;
      
      for (const result of mgr.searchFile(fullpath, abbrpath, file)) {
        results.push(result);
      }
    }

    const results_by_file = {}

    for (const result of results) {
      if (!results_by_file.hasOwnProperty(result.path))
        results_by_file[result.path] = []
      results_by_file[result.path].push(result);
    }
    const sorted_by_relevance = []
    for (const filepath in results_by_file) {
      const fileresults = results_by_file[filepath];
      sorted_by_relevance.push(new ResultFile(
          filepath, fileresults[0].filename, fileresults.length));
    }
    sorted_by_relevance.sort((a, b) => b.count - a.count)

    search_results = results;
    results_by_relevance = sorted_by_relevance;
    current_result = 0;
  }
}

// Produce a set of regexp-buildable strings by parsing quoted or escaped
// segments of a string.
function lexingRegexSplit(command, arg_string) {
  const res = [];
  let i = 0, fr = 0, pstr = "";
  while (i < arg_string.length) {
    if (arg_string[i] == ' ') {
      if (pstr.length || fr != i) {
        res.push(pstr + arg_string.substring(fr, i));
      }
      fr = ++i;
      pstr = "";
    } else if (arg_string[i] == '"') {
      pstr += arg_string.substring(fr, i);
      fr = ++i;
      while (i < arg_string.length && arg_string[i] != '"') {
        if (arg_string[i] == '\\') ++i;
        ++i;
      }
      pstr += RegExp.escape(backslashes.unescape(arg_string.substring(fr, i)));
      fr = ++i;
    } else if (arg_string[i] == '\'') {
      pstr += arg_string.substring(fr, i);
      fr = ++i;
      while (i < arg_string.length && arg_string[i] != '\'') ++i;
      pstr += RegExp.escape(arg_string.substring(fr, i))
      fr = ++i;
    } else if (arg_string[i] == '\\') {
      i += 2;  // Whatever the next character is, ignore it
      // Multi-char escape sequences can't contain anything we care about
    } else {
      ++i;
    }
  }
  leftovers = pstr + arg_string.substr(fr);
  if (leftovers) {
    res.push(leftovers);
  }
  return res;
}

function CaseSensitive(args) {
  let res = false;
  function ffun(x) {
    if (x.toLowerCase() == 'case:yes') {
      res = true;
      return false;
    }
    if (x.toLowerCase() == 'case:no') {
      res = false;
      return false;
    }
    return true;
  }
  return [args.filter(ffun), res]
}

function nextResult() {
  if (search_results == null) {
    return "Try doing a search first with, eg, !egrep";
  }
  if (search_results.length < 1) {
    displayed_result = null;
    return "Search had no results....";
  }
  if (search_results.length <= current_result) {
    return "No more results.";
  }
  const result_num = current_result + 1;  // English is 1-based
  const result_count = search_results.length;
  const result_str = search_results[current_result].str();
  res = `[${result_num}/${result_count}]  ${result_str}`;
  displayed_result = search_results[current_result++];
  return res;
}

function assemble_url(args, mgr) {
  [args, casesens] = CaseSensitive(args)
  if (args.length > 0) {
    file_predicates = []
    for (let i = 0; i < args.length; ++i) {
      src = searcher(args[i], casesens);
      if (src.ok) file_predicates.push(src.value);
      else return src.error;
    }
    mgr.file_predicates = file_predicates;
    mgr.search_predicates = [];
    mgr.populateSearch();
    nextResult();
  }
  if (displayed_result && mgr.repo == displayed_result.repo) {
    res = `https://github.com/${displayed_result.repo}/blob/master/`;
    res += displayed_result.path;
    if (displayed_result.lineno)
      res += "#L" + displayed_result.lineno;
    if (args.length > 1 && search_results.length > 1) {
      res += ` (and ${search_results.length - 1} other results;`;
      res += ' try a grep with `f:<filename>`)';
    }
    return res;
  }
  if (args.length) return "No matching files...";
  return `https://github.com/${mgr.repo}/`;
}

function searcher(regexp, match_case) {
  try {
    const re = new RegExp(regexp, match_case ? '' : 'i');
    return { "ok": true, "value": arg => arg.match(re) };
  } catch(e) {
    return {
      "ok": false,
      "error": 'Error evaluating "' + regexp + '": ' + e.message
    };
  }
}

function fun_grep(args, mgr) {
  [args, casesens] = CaseSensitive(args)
  let file_predicates = [];
  let search_predicates = [];
  for (let i = 0; i < args.length; ++i) {
    if (args[i][0] == 'f' && args[i][1] == ':') {
      src = searcher(args[i].substr(2), casesens);
      if (src.ok) file_predicates.push(src.value);
      else return src.error;
    } else {
      src = searcher(args[i], casesens);
      if (src.ok) search_predicates.push(src.value);
      else return src.error;
    }
  }
  mgr.file_predicates = file_predicates;
  mgr.search_predicates = search_predicates;
  mgr.populateSearch();
  return nextResult();
}

function fun_url(args, mgr) {
  return '<' + assemble_url(args, mgr) + '>';
}

function fun_grepfiles() {
  if (results_by_relevance == null)
    return "Try doing a search first with, eg, !egrep";
  if (!results_by_relevance)
    return "No matching files. Try a different search.";
  i = 0;
  res = "";
  while (i < 16 && i < results_by_relevance.length) {
    if (res.length) res += ", ";
    res += `\`${results_by_relevance[i].filename}\``;
    res += ` (${results_by_relevance[i].count})`;
    ++i;
  }
  return res;
}

function fun_grepnextfile() {
  if (!displayed_result || !current_result)
    return "Try doing a search, first.";
  
  fnf = current_result;
  while (fnf < search_results.length) {
    if (search_results[fnf].path != displayed_result.path) {
      current_result = fnf;
      return nextResult()
    }
    ++fnf;
  }
  return "No more matching files.";
}

const enigma_manager = new SearchManager('enigma-dev/enigma-dev')
const    lgm_manager = new SearchManager('IsmAvatar/LateralGM')
const    rgm_manager = new SearchManager('enigma-dev/RadialGM')

exports.commands = {
  'egrep': {
    'handler': args => fun_grep(args, enigma_manager),
    'arg_parser': lexingRegexSplit,
    'help': 'Search the ENIGMA repository using a CodeSearch expression.'
  },
  'lgrep': {
    'handler': args => fun_grep(args, lgm_manager),
    'arg_parser': lexingRegexSplit,
    'help': 'Search the LateralGM repository using a CodeSearch expression.'
  },
  'rgrep': {
    'handler': args => fun_grep(args, rgm_manager),
    'arg_parser': lexingRegexSplit,
    'help': 'Search the RadialGM repository using a CodeSearch expression.'
  },
  'eurl':  {
    'handler': args => fun_url(args, enigma_manager),
    'arg_parser': lexingRegexSplit,
    'help': 'Give the GitHub URL of the current result (or of a new file ' +
            'search in the ENIGMA repository).'
  },
  'lurl':  {
    'handler': args => fun_url(args, lgm_manager),
    'arg_parser': lexingRegexSplit,
    'help': 'Give the GitHub URL of the current result (or of a new file ' +
            'search in the LateralGM repository).'
  },
  'rurl':  {
    'handler': args => fun_url(args, rgm_manager),
    'arg_parser': lexingRegexSplit,
    'help': 'Give the GitHub URL of the current result (or of a new file ' +
            'search in the RadialGM repository).'
  },
  'grepfiles': {
    'handler': fun_grepfiles,
    'arg_parser': null,
    'help': 'Show the list of files containing search results.'
  },
  'nextfile': {
    'handler': fun_grepnextfile,
    'arg_parser': null,
    'help': 'Advance the search to the first result in the next matching file.'
  },
  'grepnextfile': {
    'handler': fun_grepnextfile,
    'arg_parser': null,
    'help': 'Advance the search to the first result in the next matching file.'
  },
  'grepnext': {
    'handler': nextResult,
    'arg_parser': null,
    'help': 'Advance to the next search result.'
  }
}

