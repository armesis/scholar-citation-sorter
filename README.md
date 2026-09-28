# Scholar Citation Sorter

A Chrome extension that sorts Google Scholar search results by citation count.

## Features
- Sort results by **Most cited**, **Least cited**, **Newest**, or back to **Original order**
- Citation-count badge next to each result title
- **Load & sort**: fetch 1–9 more result pages (up to ~100 articles) and sort them together. Pages are fetched 2.5 s apart to avoid Scholar's CAPTCHA.

## Install
1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** and select this folder
4. Search on [Google Scholar](https://scholar.google.com); the sort bar appears above the results

To use another Scholar domain, add it to `matches` in `manifest.json`.
