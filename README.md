# Hilliard Darby website concept

## Preview

Open index.html in a browser, or use VS Code Live Server.

The website has no package installation or build requirement after
these files have been generated.

## Repository

Put the generated HTML files, styles.css, script.js and images folder
in your website repository's publishing directory.

Keep relative links intact. All generated HTML pages are in one folder.

## Replace page images

Each HTML file contains its own image path, for example:

    images/band.svg

Replace that source with your approved photo:

    images/band.jpg

Update the image alt text and remove the placeholder caption.
Change the image itself; do not merely rename SVG bytes to .jpg.

The homepage's campus placeholder is images/home.svg.
Its athletics card uses images/athletics.svg.

## Edit content

Content is directly in each HTML file.
CSS is shared in styles.css.
Navigation is repeated in the generated HTML so it works without JS.

To regenerate consistently, edit build_darby.py, rename the existing
output folder, and run the generator again.

## Review

Read CONTENT_REVIEW.md before adopting this as the official website.
content-sources.json maps pages to their source and image brief.
