(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [
    ...root.querySelectorAll(selector),
  ];
  const icon = (name) =>
    `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const pad = (value) => String(value).padStart(2, "0");
  const motionPreference = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  );
  const storage = {
    get(key, fallback) {
      try {
        return JSON.parse(localStorage.getItem(key)) ?? fallback;
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        /* Private browsing can disable storage. */
      }
    },
  };
  const saved = storage.get("showtime-settings", {});
  const settings = {
    format24: typeof saved?.format24 === "boolean" ? saved.format24 : false,
    seconds: typeof saved?.seconds === "boolean" ? saved.seconds : true,
    motion: typeof saved?.motion === "boolean" ? saved.motion : true,
    dark: typeof saved?.dark === "boolean" ? saved.dark : false,
  };
  const cities = [
    {
      id: "new-york",
      name: "New York",
      country: "United States",
      zone: "America/New_York",
    },
    {
      id: "london",
      name: "London",
      country: "United Kingdom",
      zone: "Europe/London",
    },
    { id: "tokyo", name: "Tokyo", country: "Japan", zone: "Asia/Tokyo" },
    {
      id: "jakarta",
      name: "Jakarta",
      country: "Indonesia",
      zone: "Asia/Jakarta",
    },
    { id: "paris", name: "Paris", country: "France", zone: "Europe/Paris" },
    {
      id: "sydney",
      name: "Sydney",
      country: "Australia",
      zone: "Australia/Sydney",
    },
    {
      id: "los-angeles",
      name: "Los Angeles",
      country: "United States",
      zone: "America/Los_Angeles",
    },
    {
      id: "singapore",
      name: "Singapore",
      country: "Singapore",
      zone: "Asia/Singapore",
    },
    {
      id: "dubai",
      name: "Dubai",
      country: "United Arab Emirates",
      zone: "Asia/Dubai",
    },
    { id: "berlin", name: "Berlin", country: "Germany", zone: "Europe/Berlin" },
    { id: "seoul", name: "Seoul", country: "South Korea", zone: "Asia/Seoul" },
    {
      id: "hong-kong",
      name: "Hong Kong",
      country: "China",
      zone: "Asia/Hong_Kong",
    },
    {
      id: "shanghai",
      name: "Shanghai",
      country: "China",
      zone: "Asia/Shanghai",
    },
    { id: "mumbai", name: "Mumbai", country: "India", zone: "Asia/Kolkata" },
    {
      id: "kathmandu",
      name: "Kathmandu",
      country: "Nepal",
      zone: "Asia/Kathmandu",
    },
    {
      id: "bangkok",
      name: "Bangkok",
      country: "Thailand",
      zone: "Asia/Bangkok",
    },
    {
      id: "istanbul",
      name: "Istanbul",
      country: "Türkiye",
      zone: "Europe/Istanbul",
    },
    {
      id: "cape-town",
      name: "Cape Town",
      country: "South Africa",
      zone: "Africa/Johannesburg",
    },
    { id: "cairo", name: "Cairo", country: "Egypt", zone: "Africa/Cairo" },
    {
      id: "nairobi",
      name: "Nairobi",
      country: "Kenya",
      zone: "Africa/Nairobi",
    },
    {
      id: "sao-paulo",
      name: "São Paulo",
      country: "Brazil",
      zone: "America/Sao_Paulo",
    },
    {
      id: "mexico-city",
      name: "Mexico City",
      country: "Mexico",
      zone: "America/Mexico_City",
    },
    {
      id: "toronto",
      name: "Toronto",
      country: "Canada",
      zone: "America/Toronto",
    },
    {
      id: "vancouver",
      name: "Vancouver",
      country: "Canada",
      zone: "America/Vancouver",
    },
    {
      id: "auckland",
      name: "Auckland",
      country: "New Zealand",
      zone: "Pacific/Auckland",
    },
    {
      id: "honolulu",
      name: "Honolulu",
      country: "United States",
      zone: "Pacific/Honolulu",
    },
  ];
  const storedCities = storage.get("showtime-cities", [
    "new-york",
    "london",
    "tokyo",
  ]);
  let selectedCities = Array.isArray(storedCities)
    ? [...new Set(storedCities)].filter((id) => cities.some((c) => c.id === id))
    : ["new-york", "london", "tokyo"];
  let activeView = "overview";
  const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const formatters = new Map();
  const formatter = (zone, options) => {
    const key = zone + JSON.stringify(options);
    if (!formatters.has(key))
      formatters.set(
        key,
        new Intl.DateTimeFormat("en-US", { timeZone: zone, ...options }),
      );
    return formatters.get(key);
  };
  const cityParts = (zone, now) => {
    const parts = formatter(zone, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
      timeZoneName: "shortOffset",
    }).formatToParts(now);
    return Object.fromEntries(parts.map((p) => [p.type, p.value]));
  };
  function offsetMinutes(offset) {
    const match = offset.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
    return match
      ? (match[1] === "-" ? -1 : 1) *
          (Number(match[2]) * 60 + Number(match[3] || 0))
      : 0;
  }
  function offsetLabel(minutes) {
    return `UTC${minutes < 0 ? "−" : "+"}${pad(Math.floor(Math.abs(minutes) / 60))}:${pad(Math.abs(minutes) % 60)}`;
  }
  function differenceLabel(minutes) {
    if (!minutes) return "Same time";
    const hours = Math.floor(Math.abs(minutes) / 60);
    const mins = Math.abs(minutes) % 60;
    return `${minutes > 0 ? "+" : "−"}${hours ? `${hours}h` : ""}${mins ? ` ${mins}m` : ""} from you`;
  }
  const motionEnabled = () => settings.motion && !motionPreference.matches;
  function animateNumber(element, value) {
    if (element.textContent === value) return;
    element.textContent = value;
    if (
      motionEnabled() &&
      document.visibilityState === "visible" &&
      element.animate
    ) {
      element.getAnimations().forEach((animation) => animation.cancel());
      element.animate(
        [
          { opacity: 0.45, transform: "translateY(5px)", filter: "blur(1px)" },
          { opacity: 1, transform: "translateY(0)", filter: "blur(0)" },
        ],
        { duration: 420, easing: "cubic-bezier(.2,.7,.2,1)" },
      );
    }
  }
  function setText(element, value) {
    if (element.textContent !== value) element.textContent = value;
  }

  function applySettings() {
    document.body.classList.toggle("dark", settings.dark);
    document.body.classList.toggle("reduce-motion", !motionEnabled());
    if (!motionEnabled())
      document.getAnimations().forEach((animation) => animation.cancel());
    $$(".seconds-part").forEach((element) => {
      element.hidden = !settings.seconds;
    });
    $$("[data-format]").forEach((button) => {
      const selected =
        Number(button.dataset.format) === (settings.format24 ? 24 : 12);
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", selected);
    });
    $("#setting-format").checked = settings.format24;
    $("#setting-seconds").checked = settings.seconds;
    $("#setting-motion").checked = motionEnabled();
    $("#setting-motion").disabled = motionPreference.matches;
    $("#motion-setting-help").textContent = motionPreference.matches
      ? "Reduced motion is enabled on your device."
      : "A little movement brings your space to life.";
    $("#setting-dark").checked = settings.dark;
    $("#motion-toggle").setAttribute("aria-pressed", !motionEnabled());
    $("#motion-toggle").setAttribute(
      "aria-label",
      motionEnabled() ? "Pause animations" : "Enable animations",
    );
    $("#motion-toggle").title = motionPreference.matches
      ? "Reduced motion is enabled on your device"
      : motionEnabled()
        ? "Pause animations"
        : "Enable animations";
    $("#theme-toggle").innerHTML = icon(settings.dark ? "sun" : "moon");
    $("#theme-toggle").setAttribute(
      "aria-label",
      `Switch to ${settings.dark ? "light" : "dark"} theme`,
    );
    $('meta[name="theme-color"]').content = settings.dark
      ? "#19201a"
      : "#f6f7f3";
    storage.set("showtime-settings", settings);
    tick();
  }
  $$("[data-format]").forEach((button) =>
    button.addEventListener("click", () => {
      settings.format24 = button.dataset.format === "24";
      applySettings();
    }),
  );
  for (const [id, key] of [
    ["format", "format24"],
    ["seconds", "seconds"],
    ["motion", "motion"],
    ["dark", "dark"],
  ]) {
    $(`#setting-${id}`).addEventListener("change", (event) => {
      settings[key] = event.target.checked;
      applySettings();
    });
  }
  $("#theme-toggle").addEventListener("click", () => {
    settings.dark = !settings.dark;
    applySettings();
  });
  $("#motion-toggle").addEventListener("click", () => {
    if (motionPreference.matches) {
      toast("Your device has reduced motion enabled. We respect that.");
      return;
    }
    settings.motion = !settings.motion;
    applySettings();
    toast(
      settings.motion
        ? "A little movement, welcomed back."
        : "Animations paused. Take it at your pace.",
    );
  });
  motionPreference.addEventListener("change", applySettings);

  // Navigation stays native: links can be bookmarked and browser history works.
  function navigate(initial = false) {
    const requested = location.hash.slice(1) || "overview";
    activeView = ["overview", "world", "focus", "stopwatch"].includes(requested)
      ? requested
      : "overview";
    $$(".view").forEach((view) => {
      view.hidden = view.id !== `view-${activeView}`;
    });
    $$(".nav-link").forEach((link) => {
      const active = link.dataset.view === activeView;
      link.classList.toggle("active", active);
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    $("#breadcrumb-title").textContent = {
      overview: "Overview",
      world: "World clock",
      focus: "Focus timer",
      stopwatch: "Stopwatch",
    }[activeView];
    if (!initial) {
      $("#main").focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: "instant" });
    }
    tick();
  }
  window.addEventListener("hashchange", () => navigate());

  function analogClock() {
    return `<svg class="analog-clock" viewBox="0 0 50 50" aria-hidden="true"><circle class="analog-face" cx="25" cy="25" r="24"/>${Array.from({ length: 12 }, (_, i) => `<path class="analog-tick" d="M25 4v${i % 3 === 0 ? 3 : 1.5}" transform="rotate(${i * 30} 25 25)"/>`).join("")}<path class="analog-hour" d="M25 25V14"/><path class="analog-minute" d="M25 25V8"/><path class="analog-second" d="M25 28V7"/><circle class="analog-center" cx="25" cy="25" r="1.7"/></svg>`;
  }
  function makeCityCard(city, removable) {
    const article = document.createElement("article");
    article.className = "world-card new-card";
    article.dataset.city = city.id;
    article.innerHTML = `<div class="world-card-top"><div><h3 class="city-title">${city.name}</h3><p class="city-country">${city.country}</p></div><span class="daylight-icon">${icon("sun")}</span></div><div class="world-card-main"><div class="city-time"><span>00:00</span><small>AM</small></div>${analogClock()}</div><div class="city-card-bottom"><span class="city-relative"></span><span class="city-offset"></span></div>${removable ? `<button class="icon-button remove-city" aria-label="Remove ${city.name}">${icon("close")}</button>` : ""}`;
    if (removable)
      $(".remove-city", article).addEventListener("click", () => {
        const cards = $$(".world-card", $("#all-clocks"));
        const index = cards.indexOf(article);
        selectedCities = selectedCities.filter((id) => id !== city.id);
        storage.set("showtime-cities", selectedCities);
        renderCities();
        const remaining = $$(".remove-city", $("#all-clocks"));
        (
          remaining[Math.min(index, remaining.length - 1)] ||
          $("#view-world .add-city")
        ).focus();
        toast(`${city.name} removed from your world.`);
      });
    return article;
  }
  function renderCities() {
    const chosen = selectedCities.map((id) =>
      cities.find((city) => city.id === id),
    );
    for (const [selector, list, removable] of [
      ["#overview-clocks", chosen.slice(0, 3), false],
      ["#all-clocks", chosen, true],
    ]) {
      const container = $(selector);
      container.replaceChildren(
        ...list.map((city) => makeCityCard(city, removable)),
      );
      if (!list.length)
        container.innerHTML =
          '<p class="empty-world">Your world starts here. Add a city to see its time.</p>';
    }
    updateCities(new Date());
  }
  function updateCities(now) {
    const localOffset = -now.getTimezoneOffset();
    const today = formatter(localZone, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
    $$(".world-card").forEach((card) => {
      if (card.closest(".view").hidden) return;
      const city = cities.find((c) => c.id === card.dataset.city);
      const parts = cityParts(city.zone, now);
      const hour = Number(parts.hour);
      const minute = Number(parts.minute);
      const second = Number(parts.second);
      const time = `${pad(settings.format24 ? hour : hour % 12 || 12)}:${parts.minute}`;
      setText($(".city-time span", card), time);
      $(".city-time small", card).hidden = settings.format24;
      setText($(".city-time small", card), hour < 12 ? "AM" : "PM");
      const night = hour < 6 || hour >= 18;
      if (card.dataset.night !== String(night)) {
        card.classList.toggle("night", night);
        $(".daylight-icon", card).innerHTML = icon(night ? "moon" : "sun");
        $(".daylight-icon", card).title = night ? "Nighttime" : "Daytime";
        card.dataset.night = String(night);
      }
      $(".analog-hour", card).style.transform =
        `rotate(${hour * 30 + minute / 2}deg)`;
      $(".analog-minute", card).style.transform =
        `rotate(${minute * 6 + second / 10}deg)`;
      $(".analog-second", card).style.transform = `rotate(${second * 6}deg)`;
      const date = formatter(city.zone, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(now);
      const dateLabel =
        date === today
          ? "Today"
          : formatter(city.zone, { weekday: "short" }).format(now);
      setText(
        $(".city-relative", card),
        `${dateLabel}, ${formatter(city.zone, { month: "short", day: "numeric" }).format(now)}`,
      );
      const offset = offsetMinutes(parts.timeZoneName);
      setText($(".city-offset", card), differenceLabel(offset - localOffset));
      $(".city-offset", card).title = offsetLabel(offset);
    });
  }
  function renderCityResults() {
    const query = $("#city-search").value.trim().toLocaleLowerCase();
    const matching = cities.filter((city) =>
      `${city.name} ${city.country} ${city.zone}`
        .toLocaleLowerCase()
        .includes(query),
    );
    $("#city-results").replaceChildren(
      ...matching.map((city) => {
        const added = selectedCities.includes(city.id);
        const button = document.createElement("button");
        button.className = "city-result";
        button.disabled = added;
        button.setAttribute(
          "aria-label",
          `${added ? "Already added" : "Add"} ${city.name}`,
        );
        button.innerHTML = `<span><strong>${city.name}</strong><small>${city.country} · ${city.zone.replaceAll("_", " ")}</small></span>${icon(added ? "check" : "plus")}`;
        button.addEventListener("click", () => {
          selectedCities.push(city.id);
          storage.set("showtime-cities", selectedCities);
          renderCities();
          $("#city-dialog").close();
          toast(`${city.name} added to your world.`);
          if (selectedCities.length > 3 && activeView === "overview")
            location.hash = "world";
        });
        return button;
      }),
    );
    if (!matching.length)
      $("#city-results").innerHTML =
        '<p class="no-results">No cities found. Try a nearby city or country.</p>';
  }
  $$(".add-city").forEach((button) =>
    button.addEventListener("click", () => {
      $("#city-search").value = "";
      renderCityResults();
      openDialog($("#city-dialog"));
      $("#city-search").focus();
    }),
  );
  $("#city-search").addEventListener("input", renderCityResults);

  function tick() {
    const now = new Date();
    const hours = now.getHours();
    if (activeView === "overview") {
      animateNumber(
        $("#local-hours"),
        pad(settings.format24 ? hours : hours % 12 || 12),
      );
      animateNumber($("#local-minutes"), pad(now.getMinutes()));
      if (settings.seconds)
        animateNumber($("#local-seconds"), pad(now.getSeconds()));
      $("#local-period").hidden = settings.format24;
      setText($("#local-period"), hours < 12 ? "AM" : "PM");
      $("#jam").setAttribute(
        "aria-label",
        now.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          ...(settings.seconds ? { second: "2-digit" } : {}),
          hour12: !settings.format24,
        }),
      );
      setText(
        $("#tanggal"),
        formatter(localZone, {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        }).format(now),
      );
      setText(
        $("#greeting"),
        `${hours < 12 ? "Good morning" : hours < 17 ? "Good afternoon" : "Good evening"}. It's good to be here.`,
      );
      $("#greeting").previousElementSibling.innerHTML =
        `<use href="#i-${hours < 6 || hours >= 18 ? "moon" : "sun"}"/>`;
      setText($("#local-offset"), offsetLabel(-now.getTimezoneOffset()));
      setText(
        $("#local-zone"),
        localZone.replaceAll("_", " ").replaceAll("/", " / "),
      );
      $("#second-progress").style.width = `${(now.getSeconds() / 59) * 100}%`;
      const midnight = new Date(now);
      midnight.setHours(0, 0, 0, 0);
      const tomorrow = new Date(midnight);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayFraction = (now - midnight) / (tomorrow - midnight);
      const percent = Math.floor(dayFraction * 100);
      if ($("#day-percent").dataset.value !== String(percent)) {
        $("#day-percent").innerHTML = `${percent}<small>%</small>`;
        $("#day-percent").dataset.value = percent;
      }
      const remainingMinutes = Math.ceil((tomorrow - now) / 60000);
      setText(
        $("#day-remaining"),
        `${Math.floor(remainingMinutes / 60)}h ${remainingMinutes % 60}m of possibility`,
      );
      $("#day-ring-fill").style.strokeDasharray = 2 * Math.PI * 42;
      $("#day-ring-fill").style.strokeDashoffset =
        2 * Math.PI * 42 * (1 - dayFraction);
    }
    setText(
      $("#top-date"),
      formatter(localZone, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(now),
    );
    updateCities(now);
    updateFocus();
  }

  // Use absolute deadlines instead of decrementing an interval, so inactive tabs stay accurate.
  const focus = {
    duration: 25 * 60 * 1000,
    remaining: 25 * 60 * 1000,
    deadline: 0,
    running: false,
    complete: false,
  };
  function updateFocus() {
    if (focus.running) {
      focus.remaining = Math.max(0, focus.deadline - Date.now());
      if (focus.remaining === 0) {
        focus.running = false;
        focus.complete = true;
        toast("Session complete. You made time for what matters.");
      }
    }
    const totalSeconds = Math.ceil(focus.remaining / 1000);
    setText(
      $("#focus-display"),
      `${pad(Math.floor(totalSeconds / 60))}:${pad(totalSeconds % 60)}`,
    );
    $("#focus-ring").style.strokeDasharray = 2 * Math.PI * 150;
    $("#focus-ring").style.strokeDashoffset =
      2 * Math.PI * 150 * (1 - focus.remaining / focus.duration);
    $(".focus-clock").classList.toggle("running", focus.running);
    const start = $("#focus-start");
    const label = focus.running
      ? "Pause session"
      : focus.complete
        ? "Start again"
        : focus.remaining < focus.duration
          ? "Keep going"
          : "Start focusing";
    if ($("span", start).textContent !== label)
      start.innerHTML = `${icon(focus.running ? "pause" : "play")}<span>${label}</span>`;
    setText(
      $("#focus-status"),
      focus.running
        ? "Just this. Just now."
        : focus.complete
          ? "Well done. Take a breath."
          : focus.remaining < focus.duration
            ? "A pause is part of the process."
            : "A fresh start awaits.",
    );
  }
  $("#focus-start").addEventListener("click", () => {
    if (focus.running) {
      focus.remaining = Math.max(0, focus.deadline - Date.now());
      focus.running = false;
    } else {
      if (focus.complete || focus.remaining === 0) {
        focus.remaining = focus.duration;
        focus.complete = false;
      }
      focus.deadline = Date.now() + focus.remaining;
      focus.running = true;
    }
    updateFocus();
  });
  function resetFocus() {
    focus.running = false;
    focus.remaining = focus.duration;
    focus.complete = false;
    updateFocus();
  }
  $("#focus-reset").addEventListener("click", resetFocus);
  $$("[data-duration]").forEach((button) =>
    button.addEventListener("click", () => {
      focus.duration = Number(button.dataset.duration) * 60 * 1000;
      resetFocus();
      $$("[data-duration]").forEach((item) => {
        item.classList.toggle("selected", item === button);
        item.setAttribute("aria-pressed", item === button);
      });
    }),
  );

  const stopwatch = {
    running: false,
    elapsed: 0,
    started: 0,
    laps: [],
    frame: null,
  };
  function elapsedTime() {
    return (
      stopwatch.elapsed +
      (stopwatch.running ? performance.now() - stopwatch.started : 0)
    );
  }
  function stopwatchText(milliseconds) {
    const centiseconds = Math.floor(milliseconds / 10);
    const seconds = Math.floor(centiseconds / 100);
    const minutes = Math.floor(seconds / 60);
    return `${minutes >= 60 ? `${pad(Math.floor(minutes / 60))}:` : ""}${pad(minutes % 60)}:${pad(seconds % 60)}.${pad(centiseconds % 100)}`;
  }
  function updateStopwatch() {
    const value = stopwatchText(elapsedTime());
    const [main, decimal] = value.split(".");
    if (activeView === "stopwatch")
      $("#stopwatch-display").innerHTML = `${main}<span>.${decimal}</span>`;
    if (stopwatch.running)
      stopwatch.frame = requestAnimationFrame(updateStopwatch);
  }
  $("#stopwatch-start").addEventListener("click", () => {
    if (stopwatch.running) {
      stopwatch.elapsed = elapsedTime();
      stopwatch.running = false;
      cancelAnimationFrame(stopwatch.frame);
    } else {
      stopwatch.started = performance.now();
      stopwatch.running = true;
    }
    $("#stopwatch-start").innerHTML =
      `${icon(stopwatch.running ? "pause" : "play")}<span>${stopwatch.running ? "Pause stopwatch" : "Keep going"}</span>`;
    $("#stopwatch-lap").disabled = !stopwatch.running;
    updateStopwatch();
  });
  $("#stopwatch-reset").addEventListener("click", () => {
    cancelAnimationFrame(stopwatch.frame);
    Object.assign(stopwatch, {
      running: false,
      elapsed: 0,
      started: 0,
      laps: [],
    });
    $("#stopwatch-start").innerHTML =
      `${icon("play")}<span>Start stopwatch</span>`;
    $("#stopwatch-lap").disabled = true;
    $("#laps").replaceChildren();
    $(".laps-table").hidden = true;
    $(".empty-laps").hidden = false;
    updateStopwatch();
  });
  $("#stopwatch-lap").addEventListener("click", () => {
    if (!stopwatch.running) return;
    const total = elapsedTime();
    const previous = stopwatch.laps.at(-1) || 0;
    stopwatch.laps.push(total);
    const row = document.createElement("tr");
    row.innerHTML = `<td>${pad(stopwatch.laps.length)}</td><td>${stopwatchText(total - previous)}</td><td>${stopwatchText(total)}</td>`;
    $("#laps").prepend(row);
    $(".laps-table").hidden = false;
    $(".empty-laps").hidden = true;
  });

  let toastTimer;
  function toast(message) {
    clearTimeout(toastTimer);
    $("#toast").textContent = message;
    $("#toast").classList.add("visible");
    toastTimer = setTimeout(
      () => $("#toast").classList.remove("visible"),
      4000,
    );
  }
  function openDialog(dialog) {
    dialog.showModal();
  }
  $("#open-settings").addEventListener("click", () =>
    openDialog($("#settings-dialog")),
  );
  document.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === ",") {
      event.preventDefault();
      if (!$("dialog[open]")) openDialog($("#settings-dialog"));
    }
  });
  $$(".mobile-settings").forEach((button) =>
    button.addEventListener("click", () => openDialog($("#settings-dialog"))),
  );
  $$("dialog").forEach((dialog) => {
    $$("[data-close]", dialog).forEach((button) =>
      button.addEventListener("click", () => dialog.close()),
    );
    dialog.addEventListener("click", (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      )
        dialog.close();
    });
  });
  $("#fullscreen-toggle").addEventListener("click", async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if ($(".clock-hero").requestFullscreen)
        await $(".clock-hero").requestFullscreen();
      else toast("Fullscreen is not supported by this browser.");
    } catch {
      toast("Your browser does not allow fullscreen here.");
    }
  });
  document.addEventListener("fullscreenchange", () => {
    $("#fullscreen-toggle").setAttribute(
      "aria-label",
      document.fullscreenElement ? "Exit expanded clock" : "Expand clock",
    );
    $("#fullscreen-toggle").title = document.fullscreenElement
      ? "Exit expanded clock"
      : "Expand clock";
  });

  let breathFrame;
  let breathStart = 0;
  let breathPhase = "";
  const breathVisual = $(".breathing-visual");
  function updateBreathing() {
    const phaseTime = (performance.now() - breathStart) % 14000;
    const phase =
      phaseTime < 4000 ? "inhale" : phaseTime < 8000 ? "hold" : "exhale";
    if (phase !== breathPhase) {
      breathPhase = phase;
      breathVisual.className = `breathing-visual ${phase}`;
      $("#breath-instruction").textContent = {
        inhale: "Breathe in",
        hold: "Gently hold",
        exhale: "Breathe out",
      }[phase];
    }
    breathFrame = requestAnimationFrame(updateBreathing);
  }
  function startBreathing() {
    openDialog($("#breath-dialog"));
    breathStart = performance.now();
    breathPhase = "";
    breathVisual.className = "breathing-visual";
    // Let the initial, smaller circle paint before gently expanding it.
    breathFrame = requestAnimationFrame(() => {
      breathFrame = requestAnimationFrame(updateBreathing);
    });
  }
  $("#open-breath").addEventListener("click", startBreathing);
  $$(".mobile-breath").forEach((button) =>
    button.addEventListener("click", startBreathing),
  );
  $("#breath-dialog").addEventListener("close", () => {
    cancelAnimationFrame(breathFrame);
    breathVisual.className = "breathing-visual";
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) tick();
  });

  renderCities();
  applySettings();
  navigate(true);
  // Align to real seconds rather than accumulating interval drift.
  function scheduleTick() {
    setTimeout(
      () => {
        tick();
        scheduleTick();
      },
      1000 - (Date.now() % 1000) + 10,
    );
  }
  scheduleTick();
})();
