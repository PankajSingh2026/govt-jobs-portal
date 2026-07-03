// site-render.js — turns <div data-category="..."> containers into
// live, scrolling headline strips using data from site-data.js.
//
//   <div class="headline-scroll grid-bottom-rule"
//        data-category="latest-jobs"
//        data-link-prefix="pages/"
//        data-limit="4">
//     <div class="headline-scroll-track"></div>
//   </div>
//
// data-link-prefix: "pages/" since job-detail.html lives in the pages/
//                    folder on every page that uses this (root pages
//                    and index.html alike, in this site's layout).
// data-limit: optional. Omit it (or set to 0) to show every post.

function metaClassAttr(post) {
  return post.metaClass ? " " + post.metaClass : "";
}

function buildCellHTML(cat, post, linkPrefix, detailPage) {
  const href = linkPrefix + detailPage + "?cat=" + encodeURIComponent(cat) + "&id=" + encodeURIComponent(post.id);
  return (
    '<div class="headline-cell">' +
      '<a class="headline-link" href="' + href + '">' + post.title + '</a>' +
      '<span class="meta' + metaClassAttr(post) + '">' + (post.meta || "") + '</span>' +
    '</div>'
  );
}

function buildTickerLinkHTML(cat, post, linkPrefix, detailPage) {
  const href = linkPrefix + detailPage + "?cat=" + encodeURIComponent(cat) + "&id=" + encodeURIComponent(post.id);
  return '<a href="' + href + '">' + post.title + (post.meta ? " — " + post.meta : "") + '</a>';
}

async function renderCategoryContainers() {
  const containers = document.querySelectorAll("[data-category]");

  for (const container of containers) {
    const cat = container.getAttribute("data-category");
    const linkPrefix = container.hasAttribute("data-link-prefix") ? container.getAttribute("data-link-prefix") : "";
    const limit = parseInt(container.getAttribute("data-limit") || "0", 10);
    const detailPage = container.hasAttribute("data-detail-page") ? container.getAttribute("data-detail-page") : "job-detail.html";

    let posts;
    try {
      posts = await getCategoryPosts(cat);
    } catch (e) {
      console.error("Failed to load posts for", cat, e);
      posts = [];
    }
    if (limit > 0) posts = posts.slice(0, limit);

    const scrollTrack = container.querySelector(".headline-scroll-track");
    const tickerTrack = container.querySelector(".ticker-track");

    if (tickerTrack) {
      // Thin scrolling banner: plain <a> links, no meta span, no
      // duplication (the ticker's own CSS animation handles the loop).
      if (posts.length === 0) {
        tickerTrack.innerHTML = '<a href="#" style="pointer-events:none;">No updates yet</a>';
        continue;
      }
      tickerTrack.innerHTML = posts.map(function (p) { return buildTickerLinkHTML(cat, p, linkPrefix, detailPage); }).join("");
      continue;
    }

    if (scrollTrack) {
      // Homepage card carousel: animated, seamless right-to-left loop.
      if (posts.length === 0) {
        scrollTrack.innerHTML = '<div class="headline-cell"><span class="meta">No postings yet — add one from the admin dashboard.</span></div>';
        scrollTrack.style.animation = "none";
        continue;
      }
      const cellsHTML = posts.map(function (p) { return buildCellHTML(cat, p, linkPrefix, detailPage); }).join("");
      scrollTrack.innerHTML = cellsHTML + cellsHTML; // duplicated once for the seamless loop
      continue;
    }

    // Category-page version: static grid, no animation, no duplication.
    if (posts.length === 0) {
      container.innerHTML = '<div class="headline-cell"><span class="meta">No postings yet — add one from the admin dashboard.</span></div>';
      continue;
    }
    container.innerHTML = posts.map(function (p) { return buildCellHTML(cat, p, linkPrefix, detailPage); }).join("");
  }
}

document.addEventListener("DOMContentLoaded", renderCategoryContainers);