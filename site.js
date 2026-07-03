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
    // Public HTTPS time services. Two sources are tried in order, so a
    // single service going down doesn't silently break the clock again.
    // Both return real-world UTC time regardless of the visitor's own
    // device clock.
    tryTimeSource("https://time.now/developer/api/timezone/Etc/UTC", function (data) {
      return data.datetime; // includes explicit UTC offset
    }).catch(function () {
      return tryTimeSource("https://timeapi.io/api/Time/current/zone?timeZone=UTC", function (data) {
        return data.dateTime + "Z"; // no offset in response, so we add one
      });
    }).catch(function () {
      // Both sources failed (offline, blocked, both services down, etc.)
      // — fall back to the device's own clock.
      offsetMs = 0;
    });
  }

  function tryTimeSource(url, extractDateTime) {
    return fetch(url)
      .then(function (res) { return res.json(); })
      .then(function (data) {
        var serverNow = new Date(extractDateTime(data)).getTime();
        if (isNaN(serverNow)) throw new Error("Unparseable time response");
        offsetMs = serverNow - Date.now();
      });
  }

  syncWithServerTime();
  render();
  setInterval(render, 1000);          // repaint the clock every second
  setInterval(syncWithServerTime, 10 * 60 * 1000); // re-sync every 10 min
});
