// site.js — shared across all pages
// Updates the "Thursday, July 2, 2026" style date in the utility bar
// to always show today's real date, using the visitor's own device clock.

document.addEventListener("DOMContentLoaded", function () {
  var dateEl = document.getElementById("live-date");
  var timeEl = document.getElementById("live-time");
  if (!dateEl && !timeEl) return;

  // offsetMs = (real server time) - (this device's own clock time)
  // Starts at 0, meaning "trust the device clock" until the server
  // time loads — then we correct for any drift.
  var offsetMs = 0;

  function render() {
    var now = new Date(Date.now() + offsetMs);

    if (dateEl) {
      dateEl.textContent = now.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    }
    if (timeEl) {
      timeEl.textContent = now.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
      });
    }
  }

  function syncWithServerTime() {
    // Public HTTPS time service (timeapi.io). Returns real-world UTC
    // time regardless of what the visitor's own device clock says.
    // Fetching UTC specifically (not a named zone) avoids any ambiguity
    // in how the browser parses the returned timestamp.
    fetch("https://time.now/api/Time/current/zone?timeZone=UTC")
      .then(function (res) { return res.json(); })
      .then(function (data) {
        var serverNow = new Date(data.dateTime + "Z").getTime(); // "Z" = explicit UTC
        offsetMs = serverNow - Date.now();
      })
      .catch(function () {
        // If the time API is unreachable (offline, blocked, service down,
        // etc.), silently fall back to the device's own clock.
        offsetMs = 0;
      });
  }

  syncWithServerTime();
  render();
  setInterval(render, 1000);          // repaint the clock every second
  setInterval(syncWithServerTime, 10 * 60 * 1000); // re-sync every 10 min
});
